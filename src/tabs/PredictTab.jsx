import { useState } from 'react';
import Ball from '../components/Ball';
import QRCode from 'react-qr-code';
import { statPredict, loadDraws, loadHistory, saveHistory, sortNums, randomPick } from '../utils/lotto';

export default function PredictTab() {
  const [mode, setMode]         = useState('stat'); // stat | ai
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [aiText, setAiText]     = useState('');
  const [qrTarget, setQrTarget] = useState(null);
  const [saveMsg, setSaveMsg]   = useState('');

  // ── 통계 예측 ────────────────────────────────────────
  function runStat() {
    setLoading(true);
    setAiText('');
    const draws = loadDraws();
    setTimeout(() => {
      const preds = draws.length >= 5
        ? statPredict(draws, 5)
        : Array.from({ length: 5 }, () => ({
            numbers: randomPick(),
            confidence: Math.floor(50 + Math.random() * 20),
            method: '랜덤',
          }));
      setResults(preds);
      setLoading(false);
    }, 800);
  }

  // ── Claude AI 예측 ───────────────────────────────────
  async function runAI() {
    // 앱 설정에서 저장한 API 키 우선, 없으면 .env
    const apiKey =
      localStorage.getItem('lotto_api_key') ||
      import.meta.env.VITE_ANTHROPIC_KEY ||
      '';

    if (!apiKey) {
      setAiText('⚠️ Claude API 키가 없습니다.\n\n설정 탭(⚙️)에서 Anthropic API 키를 입력해주세요.\n발급: https://console.anthropic.com/keys');
      return;
    }

    setLoading(true);
    setResults([]);
    setAiText('');

    const draws = loadDraws().slice(0, 10);
    const drawText = draws.length
      ? draws.map(d =>
          `${d.round}회(${d.date}): [${d.numbers.join(',')}] +보너스${d.bonus}`
        ).join('\n')
      : '(데이터 없음 — 홈 탭에서 먼저 당첨 데이터를 불러오세요)';

    const prompt = `당신은 한국 로또 6/45 번호 분석 전문가입니다.

최근 당첨 번호 데이터:
${drawText}

위 데이터를 분석하여 다음을 고려한 로또 번호 5세트를 추천해주세요:
1. 최근 출현 빈도 패턴
2. 미출현 번호 분석 (오랫동안 안 나온 번호)
3. 번호 구간 분포 (1-10, 11-20, 21-30, 31-40, 41-45)
4. 홀짝 균형
5. 연속 번호 패턴

반드시 아래 형식으로만 응답하세요:
[세트1] A B C D E F
[세트2] A B C D E F
[세트3] A B C D E F
[세트4] A B C D E F
[세트5] A B C D E F

근거: (2-3문장 분석 요약)`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-calls': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const text = data.content?.[0]?.text || '';
      setAiText(text);

      // 파싱: [세트N] 숫자...
      const regex = /\[세트\d+\]\s+([\d\s]+)/g;
      const parsed = [];
      let m;
      while ((m = regex.exec(text)) !== null) {
        const nums = m[1].trim().split(/\s+/).map(Number)
          .filter(n => n >= 1 && n <= 45);
        if (nums.length === 6) {
          parsed.push({
            numbers: sortNums(nums),
            confidence: Math.floor(65 + Math.random() * 25),
            method: 'Claude AI',
          });
        }
      }
      if (parsed.length) setResults(parsed);

    } catch (e) {
      setAiText(`⚠️ AI 분석 오류: ${e.message}\n\n통계 탭을 이용하거나 API 키를 다시 확인해주세요.`);
    }
    setLoading(false);
  }

  // ── 번호 저장 ────────────────────────────────────────
  function saveSet(set, idx) {
    const list = loadHistory();
    list.unshift({ ...set, savedAt: new Date().toLocaleString('ko-KR'), id: Date.now() });
    saveHistory(list.slice(0, 100));
    setSaveMsg(`${idx + 1}번 세트 저장!`);
    setTimeout(() => setSaveMsg(''), 1800);
  }

  function saveAll() {
    const list = loadHistory();
    const newItems = results.map((s, i) => ({
      ...s,
      savedAt: new Date().toLocaleString('ko-KR'),
      id: Date.now() + i,
    }));
    saveHistory([...newItems, ...list].slice(0, 100));
    setSaveMsg('전체 5세트 저장 완료!');
    setTimeout(() => setSaveMsg(''), 2000);
  }

  return (
    <div className="content">
      {/* 저장 완료 토스트 */}
      {saveMsg && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--accent-gold)', color: '#000', padding: '10px 22px',
          borderRadius: 30, fontWeight: 700, fontSize: 13, zIndex: 999,
          boxShadow: 'var(--glow-gold)',
        }}>
          📥 {saveMsg}
        </div>
      )}

      {/* 모드 선택 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { key: 'stat', label: '📊 통계 분석', desc: '빈도·패턴 기반 (오프라인)' },
          { key: 'ai',   label: '🤖 Claude AI', desc: '딥 분석 (API 키 필요)' },
        ].map(m => (
          <button
            key={m.key}
            onClick={() => { setMode(m.key); setResults([]); setAiText(''); }}
            style={{
              flex: 1, padding: '13px 8px', borderRadius: 12,
              border: `2px solid ${mode === m.key ? 'var(--accent-gold)' : 'var(--border)'}`,
              background: mode === m.key ? 'rgba(245,200,66,.1)' : 'var(--bg-card)',
              color: mode === m.key ? 'var(--accent-gold)' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 700,
              transition: 'all .2s',
            }}
          >
            <div>{m.label}</div>
            <div style={{ fontSize: 10, opacity: .7, marginTop: 3, fontWeight: 400 }}>{m.desc}</div>
          </button>
        ))}
      </div>

      {/* 생성 버튼 */}
      <button
        className="btn-primary"
        onClick={mode === 'stat' ? runStat : runAI}
        disabled={loading}
        style={{ marginBottom: 20 }}
      >
        {loading
          ? '⏳ 분석 중...'
          : mode === 'stat'
            ? '📊 통계 번호 5세트 생성'
            : '🤖 AI 번호 5세트 생성'}
      </button>

      {/* 로딩 */}
      {loading && (
        <div className="ai-thinking">
          <div className="think-dots">
            <span /><span /><span />
          </div>
          <span>
            {mode === 'ai'
              ? 'Claude AI가 패턴을 분석 중입니다...'
              : '빈도 통계 데이터 처리 중...'}
          </span>
        </div>
      )}

      {/* 결과 번호 */}
      {results.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div className="section-label" style={{ marginBottom: 0 }}>✨ 추천 번호</div>
            <button className="btn-cyan" style={{ padding: '6px 14px', fontSize: 12 }} onClick={saveAll}>
              전체 저장
            </button>
          </div>

          <div className="result-sets">
            {results.map((set, i) => (
              <div key={i} className="result-set">
                <span className="result-set-num">{i + 1}</span>
                <div className="ball-row" style={{ flex: 1, justifyContent: 'center', gap: 5 }}>
                  {set.numbers.map(n => <Ball key={n} n={n} small />)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span className="confidence">{set.confidence}%</span>
                  <button
                    className="btn-secondary"
                    style={{ padding: '5px 8px', fontSize: 11 }}
                    onClick={() => saveSet(set, i)}
                  >
                    저장
                  </button>
                  <button
                    className="btn-cyan"
                    style={{ padding: '5px 8px', fontSize: 11 }}
                    onClick={() => setQrTarget(
                      `로또AI 추천\n${set.numbers.join(' ')}\n${set.method} · 신뢰도 ${set.confidence}%\n${new Date().toLocaleDateString('ko-KR')}`
                    )}
                  >
                    QR
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 방법 뱃지 */}
          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <span className="ai-badge">{results[0]?.method}</span>
          </div>
        </>
      )}

      {/* AI 분석 텍스트 */}
      {aiText && (
        <div style={{ marginTop: 16 }}>
          <div className="section-label">💬 AI 분석 내용</div>
          <div className="ai-response">{aiText}</div>
        </div>
      )}

      {/* 초기 상태 안내 */}
      {!loading && results.length === 0 && !aiText && (
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <div className="empty-text">
            위 버튼을 눌러 예측 번호를 생성하세요.<br /><br />
            <span style={{ color: 'var(--accent-gold)' }}>📊 통계 분석</span> — 인터넷 없이도 사용 가능<br />
            <span style={{ color: 'var(--accent-cyan)' }}>🤖 Claude AI</span> — 설정에서 API 키 입력 필요<br /><br />
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
              홈 탭에서 당첨 데이터를 불러오면 더 정확합니다
            </span>
          </div>
        </div>
      )}

      {/* QR 모달 */}
      {qrTarget && (
        <div className="modal-overlay" onClick={() => setQrTarget(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">📱 QR 코드 공유</div>
            <div style={{ background: '#fff', padding: 16, borderRadius: 12, display: 'inline-block' }}>
              <QRCode value={qrTarget} size={180} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.8 }}>
              {qrTarget.split('\n').map((l, i) => <div key={i}>{l}</div>)}
            </div>
            <button className="modal-close" onClick={() => setQrTarget(null)}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}
