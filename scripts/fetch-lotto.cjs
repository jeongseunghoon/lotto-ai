// GitHub Actions에서 실행 - 동행복권 당첨번호 수집
// 한국 프록시 경유 + 다중 방법 시도

const https = require('https');
const fs    = require('fs');
const path  = require('path');

function calcLatestRound() {
  const start = new Date('2002-12-07T00:00:00+09:00');
  return Math.floor((Date.now() - start.getTime()) / (7 * 24 * 3600 * 1000)) + 1;
}

// HTTP/HTTPS 요청 헬퍼
function httpRequest(url, headers) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : require('http');
    const req = lib.get(url, { headers: headers || {} }, (res) => {
      // 리다이렉트 처리
      if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : `${u.protocol}//${u.host}${res.headers.location}`;
        res.resume();
        return httpRequest(next, headers).then(resolve).catch(reject);
      }
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function fetchRound(round) {
  const direct = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${round}`;
  const enc    = encodeURIComponent(direct);

  const browserHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'ko-KR,ko;q=0.9',
    'Referer': 'https://www.dhlottery.co.kr/gameResult.do?method=byWin',
    'X-Requested-With': 'XMLHttpRequest',
  };

  // 여러 방법 순차 시도
  const attempts = [
    // 1) corsproxy.io (가장 안정적)
    `https://corsproxy.io/?url=${enc}`,
    // 2) allorigins
    `https://api.allorigins.win/raw?url=${enc}`,
    // 3) codetabs
    `https://api.codetabs.com/v1/proxy?quest=${enc}`,
    // 4) thingproxy
    `https://thingproxy.freeboard.io/fetch/${direct}`,
    // 5) 직접 (가능성 낮음)
    direct,
  ];

  for (const url of attempts) {
    try {
      const { status, body } = await httpRequest(url, browserHeaders);
      if (status !== 200) continue;
      if (!body.trim().startsWith('{')) continue;

      let data = JSON.parse(body);
      // allorigins get 래퍼 처리
      if (data.contents) {
        try { data = JSON.parse(data.contents); } catch { continue; }
      }
      if (data.returnValue === 'success') {
        console.log(`  OK round ${round} via ${url.substring(0, 40)}...`);
        return data;
      }
    } catch (e) {
      // 다음 시도
    }
  }
  console.log(`  FAIL round ${round}`);
  return null;
}

async function main() {
  const latest = calcLatestRound();
  const count = 60;
  const draws = [];

  console.log(`Fetching rounds ${latest} down to ${latest - count}...`);

  for (let r = latest; r > latest - count && r > 0; r--) {
    const data = await fetchRound(r);
    if (data) {
      draws.push({
        round:    data.drwNo,
        date:     data.drwNoDate,
        numbers:  [data.drwtNo1, data.drwtNo2, data.drwtNo3, data.drwtNo4, data.drwtNo5, data.drwtNo6],
        bonus:    data.bnusNo,
        prize1:   data.firstWinamnt,
        winners1: data.firstPrzwnerCo,
      });
    }
    await new Promise(res => setTimeout(res, 300));
  }

  draws.sort((a, b) => b.round - a.round);

  const output = {
    updated: new Date().toISOString(),
    latest:  draws[0]?.round || null,
    count:   draws.length,
    draws:   draws,
  };

  const outDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'lotto-data.json'), JSON.stringify(output, null, 2));

  console.log(`\nSaved ${draws.length} draws. Latest: ${output.latest}`);
}

main().catch(e => { console.error(e); process.exit(1); });
