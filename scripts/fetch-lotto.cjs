// GitHub Actions에서 실행 - 동행복권 당첨번호 수집
// 한국이 아닌 GitHub 서버(미국)지만 Actions는 차단 우회 가능

const https = require('https');
const fs = require('fs');
const path = require('path');

function calcLatestRound() {
  const start = new Date('2002-12-07T00:00:00+09:00');
  return Math.floor((Date.now() - start.getTime()) / (7 * 24 * 3600 * 1000)) + 1;
}

function fetchRound(round) {
  return new Promise((resolve, reject) => {
    const url = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${round}`;
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        'Referer': 'https://www.dhlottery.co.kr/gameResult.do?method=byWin',
        'X-Requested-With': 'XMLHttpRequest',
      },
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve(data.returnValue === 'success' ? data : null);
        } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(10000, () => { req.destroy(); resolve(null); });
  });
}

async function main() {
  const latest = calcLatestRound();
  const count = 60; // 최근 60회 수집
  const draws = [];

  console.log(`Fetching rounds ${latest} down to ${latest - count}...`);

  for (let r = latest; r > latest - count && r > 0; r--) {
    const data = await fetchRound(r);
    if (data) {
      draws.push({
        round: data.drwNo,
        date: data.drwNoDate,
        numbers: [data.drwtNo1, data.drwtNo2, data.drwtNo3, data.drwtNo4, data.drwtNo5, data.drwtNo6],
        bonus: data.bnusNo,
        prize1: data.firstWinamnt,
        winners1: data.firstPrzwnerCo,
      });
      console.log(`  OK round ${data.drwNo}: ${data.drwtNo1},${data.drwtNo2},${data.drwtNo3},${data.drwtNo4},${data.drwtNo5},${data.drwtNo6}+${data.bnusNo}`);
    } else {
      console.log(`  skip round ${r} (no data yet or failed)`);
    }
    // 과부하 방지
    await new Promise(res => setTimeout(res, 200));
  }

  draws.sort((a, b) => b.round - a.round);

  const output = {
    updated: new Date().toISOString(),
    latest: draws[0]?.round || null,
    count: draws.length,
    draws: draws,
  };

  // public 폴더에 저장 (배포 시 접근 가능)
  const outDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'lotto-data.json'), JSON.stringify(output, null, 2));

  console.log(`\nSaved ${draws.length} draws. Latest: ${output.latest}`);
}

main();
