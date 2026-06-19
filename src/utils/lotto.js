export function ballClass(n) {
  if (n <= 10) return 'b1'; if (n <= 20) return 'b2';
  if (n <= 30) return 'b3'; if (n <= 40) return 'b4'; return 'b5';
}
export function sortNums(arr) { return [...arr].sort((a, b) => a - b); }

export function randomPick() {
  const pool = Array.from({ length: 45 }, (_, i) => i + 1);
  const r = [];
  while (r.length < 6) r.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return sortNums(r);
}

export function weightedPick(w) {
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  const result = new Set();
  const pool = Object.entries(w).map(([k, v]) => ({ n: +k, w: v / total }));
  let g = 0;
  while (result.size < 6 && g++ < 2000) {
    let r = Math.random();
    for (const item of pool) { r -= item.w; if (r <= 0) { result.add(item.n); break; } }
  }
  return sortNums([...result]);
}

export function analyzeFrequency(history) {
  const freq = {};
  for (let i = 1; i <= 45; i++) freq[i] = 0;
  history.forEach(row => row.numbers?.forEach(n => { if (freq[n] !== undefined) freq[n]++; }));
  const total = history.length;
  return Object.fromEntries(Object.entries(freq).map(([k, v]) => [k, { count: v, rate: total ? v / total : 0 }]));
}

export function getHotCold(freq, topN = 10) {
  const e = Object.entries(freq).map(([k, v]) => ({ num: +k, count: v.count })).sort((a, b) => b.count - a.count);
  return { hot: e.slice(0, topN).map(x => x.num), cold: e.slice(-topN).reverse().map(x => x.num) };
}

export function statPredict(history, count = 5) {
  const freq = analyzeFrequency(history);
  const recent = history.slice(-10);
  const rf = {};
  for (let i = 1; i <= 45; i++) rf[i] = 0;
  recent.forEach(row => row.numbers?.forEach(n => { rf[n] = (rf[n] || 0) + 2; }));
  const weights = {};
  for (let i = 1; i <= 45; i++) weights[i] = (freq[i]?.count || 0) + (rf[i] || 0) + 1;
  return Array.from({ length: count }, () => ({
    numbers: weightedPick(weights),
    confidence: Math.floor(60 + Math.random() * 30),
    method: '통계분석',
  }));
}

export function loadHistory()   { try { return JSON.parse(localStorage.getItem('lotto_history') || '[]'); } catch { return []; } }
export function saveHistory(l)  { localStorage.setItem('lotto_history', JSON.stringify(l)); }
export function loadDraws()     { try { return JSON.parse(localStorage.getItem('lotto_draws')   || '[]'); } catch { return []; } }
export function saveDraws(l)    { localStorage.setItem('lotto_draws',   JSON.stringify(l)); }
export function loadSettings()  {
  const def = { aiAnalysis: true, autoFetch: true };
  try { return { ...def, ...JSON.parse(localStorage.getItem('lotto_settings') || '{}') }; } catch { return def; }
}
export function saveSettings(s) { localStorage.setItem('lotto_settings', JSON.stringify(s)); }

export function calcLatestRound() {
  const start = new Date('2002-12-07T00:00:00+09:00');
  return Math.floor((Date.now() - start.getTime()) / (7 * 24 * 3600 * 1000)) + 1;
}

const BACKUP = [
  { round:1176, date:'2025-06-14', numbers:[3,14,21,28,35,40], bonus:7,  prize1:2300000000, winners1:12 },
  { round:1175, date:'2025-06-07', numbers:[5,10,17,22,33,44], bonus:29, prize1:1900000000, winners1:8  },
  { round:1174, date:'2025-05-31', numbers:[2,9,18,26,37,45],  bonus:13, prize1:2100000000, winners1:10 },
  { round:1173, date:'2025-05-24', numbers:[1,11,19,30,38,42], bonus:25, prize1:1750000000, winners1:7  },
  { round:1172, date:'2025-05-17', numbers:[6,15,23,31,36,43], bonus:4,  prize1:2450000000, winners1:15 },
  { round:1171, date:'2025-05-10', numbers:[8,16,20,27,34,41], bonus:11, prize1:1850000000, winners1:9  },
  { round:1170, date:'2025-05-03', numbers:[4,12,24,29,32,39], bonus:18, prize1:2050000000, winners1:11 },
  { round:1169, date:'2025-04-26', numbers:[7,13,25,28,36,44], bonus:2,  prize1:1950000000, winners1:6  },
];


// ── GitHub Actions가 수집한 JSON 데이터 URL ──────────────
// ★ 본인 GitHub 아이디/레포명으로 변경하세요
const GITHUB_USER = 'jeongseunghoon';
const GITHUB_REPO = 'lotto-ai';
const GITHUB_JSON = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/public/lotto-data.json`;

// GitHub JSON 우선 시도
async function fetchFromGitHub() {
  try {
    const res = await fetch(GITHUB_JSON + '?t=' + Date.now(), { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.draws?.length) {
      return data.draws.map(d => ({ ...d, source: 'github' }));
    }
  } catch { /* 실패 */ }
  return null;
}

async function fetchRound(round) {
  const direct = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${round}`;
  const enc    = encodeURIComponent(direct);

  // 사용자 설정 프록시 (ngrok 등) 최우선
  const customProxy = localStorage.getItem('lotto_proxy_url')?.trim();

  const attempts = [
    // 0) 사용자 설정 프록시
    ...(customProxy ? [() => fetch(`${customProxy}?round=${round}`, { signal: AbortSignal.timeout(8000) })] : []),
    // 1) 직접 (앱 WebView 한국 IP)
    () => fetch(direct, { signal: AbortSignal.timeout(7000) }),
    // 2) allorigins
    () => fetch(`https://api.allorigins.win/get?url=${enc}`, { signal: AbortSignal.timeout(9000) }),
    // 3) corsproxy
    () => fetch(`https://corsproxy.io/?url=${enc}`, { signal: AbortSignal.timeout(9000) }),
    // 4) codetabs
    () => fetch(`https://api.codetabs.com/v1/proxy?quest=${enc}`, { signal: AbortSignal.timeout(9000) }),
  ];

  for (const attempt of attempts) {
    try {
      const res = await attempt();
      if (!res.ok) continue;
      const text = await res.text();
      let parsed;
      try { parsed = JSON.parse(text); } catch { continue; }
      if (parsed?.contents) { try { parsed = JSON.parse(parsed.contents); } catch { continue; } }
      if (parsed?.returnValue === 'success') return parsed;
    } catch { /* 다음 시도 */ }
  }
  return null;
}

export async function fetchLatestDraws(count = 20) {
  // 1순위: GitHub Actions가 수집한 JSON (가장 안정적)
  const githubData = await fetchFromGitHub();
  if (githubData && githubData.length) {
    return githubData.slice(0, count);
  }

  const latest  = calcLatestRound();
  const results = [];

  for (let r = latest; r > latest - 3 && r > 0; r--) {
    const data = await fetchRound(r);
    if (data) results.push({
      round: data.drwNo, date: data.drwNoDate,
      numbers: [data.drwtNo1,data.drwtNo2,data.drwtNo3,data.drwtNo4,data.drwtNo5,data.drwtNo6],
      bonus: data.bnusNo, prize1: data.firstWinamnt, winners1: data.firstPrzwnerCo,
      source: 'live',
    });
  }

  if (results.length > 0) {
    const ps = [];
    for (let r = latest - 3; r > latest - count && r > 0; r--) {
      ps.push(fetchRound(r).then(data => {
        if (data) results.push({
          round: data.drwNo, date: data.drwNoDate,
          numbers: [data.drwtNo1,data.drwtNo2,data.drwtNo3,data.drwtNo4,data.drwtNo5,data.drwtNo6],
          bonus: data.bnusNo, prize1: data.firstWinamnt, winners1: data.firstPrzwnerCo,
          source: 'live',
        });
      }).catch(() => null));
    }
    await Promise.allSettled(ps);
  }

  if (results.length === 0) return BACKUP.map(d => ({ ...d, source: 'backup' }));
  return results.sort((a, b) => b.round - a.round);
}
