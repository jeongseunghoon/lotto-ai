const https = require('https');

function get(url, headers) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      // 리다이렉트
      if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : 'https://www.dhlottery.co.kr' + res.headers.location;
        res.resume();
        return get(next, headers).then(resolve).catch(reject);
      }
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

exports.handler = async function(event) {
  const CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  const round = event.queryStringParameters && event.queryStringParameters.round;
  if (!round) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'round required' }) };

  // 시도할 URL 목록
  const attempts = [
    // 1) 동행복권 API v2 (모바일 앱용)
    `https://m.dhlottery.co.kr/gameResult.do?method=byWin&drwNo=${round}&returnUrl=json`,
    // 2) 동행복권 API 직접
    `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${round}`,
    // 3) 동행복권 JSON API
    `https://dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${round}`,
  ];

  const headerSets = [
    // 모바일 앱처럼 요청
    {
      'User-Agent': 'DhLottery/1.0 (Android; Mobile)',
      'Accept': 'application/json',
      'Accept-Language': 'ko-KR',
    },
    // 크롬 데스크톱처럼 요청
    {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Accept-Language': 'ko-KR,ko;q=0.9',
      'Referer': 'https://www.dhlottery.co.kr/gameResult.do?method=byWin',
      'X-Requested-With': 'XMLHttpRequest',
    },
  ];

  let lastError = '';

  for (const url of attempts) {
    for (const headers of headerSets) {
      try {
        const { status, body } = await get(url, headers);
        // JSON 파싱 시도
        if (body.trim().startsWith('{') || body.trim().startsWith('[')) {
          const data = JSON.parse(body);
          if (data.returnValue === 'success' || data.drwNo) {
            return {
              statusCode: 200,
              headers: { ...CORS, 'Cache-Control': 'public, max-age=3600' },
              body: JSON.stringify(data),
            };
          }
        }
        lastError = `status=${status} body=${body.substring(0,80)}`;
      } catch(e) {
        lastError = e.message;
      }
    }
  }

  // 모든 시도 실패 → 공공데이터포털 대안 안내
  return {
    statusCode: 502,
    headers: CORS,
    body: JSON.stringify({ error: 'all attempts failed', last: lastError }),
  };
};
