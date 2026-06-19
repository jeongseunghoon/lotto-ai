const http  = require('http');
const https = require('https');
const PORT  = 3001;

function fetchLotto(round) {
  return new Promise((resolve, reject) => {
    const url = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${round}`;
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://www.dhlottery.co.kr/',
      },
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch(e) { reject(new Error('parse:' + body.slice(0,80))); }
      });
    });
    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  const round = new URL(req.url, `http://localhost`).searchParams.get('round');
  if (!round) { res.writeHead(400); res.end(JSON.stringify({error:'round required'})); return; }
  try {
    const data = await fetchLotto(round);
    res.writeHead(200);
    res.end(JSON.stringify(data));
    console.log('[OK] ' + round + ' ' + data.returnValue);
  } catch(e) {
    res.writeHead(502);
    res.end(JSON.stringify({error: e.message}));
    console.log('[ERR] ' + e.message);
  }
}).listen(PORT, () => {
  console.log('====================================');
  console.log(' Lotto Proxy Server : ' + PORT);
  console.log(' Test: http://localhost:' + PORT + '?round=1176');
  console.log('====================================');
});
