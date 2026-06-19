import { useState, useEffect } from 'react';
import Ball from '../components/Ball';
import { fetchLatestDraws, loadDraws, saveDraws, loadSettings, calcLatestRound } from '../utils/lotto';

export default function HomeTab() {
  const [draws, setDraws]   = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | ok | backup | err
  const [msg, setMsg]       = useState('');

  useEffect(() => {
    const cached = loadDraws();
    if (cached.length) {
      setDraws(cached);
      setStatus(cached[0].source === 'backup' ? 'backup' : 'ok');
    }
    const settings = loadSettings();
    if (settings.autoFetch || !cached.length) refresh();
  }, []);

  async function refresh() {
    setStatus('loading');
    setMsg('당첨번호 불러오는 중...');
    try {
      const data = await fetchLatestDraws(20);
      saveDraws(data);
      setDraws(data);
      if (data[0]?.source === 'backup') {
        setStatus('backup');
        setMsg('네트워크 연결 안 됨 — 저장된 데이터 표시 중');
      } else {
        setStatus('ok');
        setMsg(`${data.length}회 데이터 업데이트 완료`);
        setTimeout(() => setMsg(''), 2500);
      }
    } catch {
      setStatus('err');
      setMsg('오류 발생 — 나중에 다시 시도하세요');
    }
  }

  const latest = draws[0];

  function formatPrize(n) {
    if (!n) return '-';
    const v = +n;
    if (v >= 1e8) return `${(v / 1e8).toFixed(1)}억원`;
    if (v >= 1e4) return `${(v / 1e4).toFixed(0)}만원`;
    return `${v.toLocaleString()}원`;
  }

  // 상태 칩 색상
  const chipStyle = {
    ok:      { border: '#38a169', color: '#68d391', bg: 'rgba(56,161,105,.1)', dot: '#38a169', text: '실시간' },
    backup:  { border: '#d69e2e', color: '#f6e05e', bg: 'rgba(214,158,46,.1)', dot: '#d69e2e', text: '저장 데이터' },
    loading: { border: '#3d4a66', color: '#7a8aaa', bg: 'transparent',         dot: null,      text: '불러오는 중' },
    err:     { border: '#e53e3e', color: '#fc8181', bg: 'rgba(229,62,62,.1)',  dot: '#e53e3e', text: '오프라인' },
    idle:    { border: '#3d4a66', color: '#7a8aaa', bg: 'transparent',         dot: null,      text: '대기' },
  };
  const chip = chipStyle[status] || chipStyle.idle;

  // 예상 최신 회차 (네트워크 없어도 표시)
  const expectedRound = calcLatestRound();

  return (
    <div className="content">
      <div className="section-label">🎰 최신 당첨번호</div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            {latest ? (
              <>
                <div className="draw-round">제 {latest.round}회</div>
                <div className="draw-date">{latest.date} (토) 추첨</div>
              </>
            ) : (
              <>
                <div className="draw-round" style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
                  예상 {expectedRound}회
                </div>
                <div className="draw-date">네트워크 연결 필요</div>
              </>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7 }}>
            {/* 상태 칩 */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 20, fontSize: 11,
              border: `1px solid ${chip.border}`,
              color: chip.color,
              background: chip.bg,
            }}>
              {status === 'loading'
                ? <span className="dot pulse" style={{ background: 'var(--accent-gold)', width: 7, height: 7, borderRadius: '50%', display: 'inline-block' }} />
                : chip.dot && <span style={{ background: chip.dot, width: 7, height: 7, borderRadius: '50%', display: 'inline-block' }} />
              }
              {chip.text}
            </span>
            <button
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: 11 }}
              onClick={refresh}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? '...' : '새로고침'}
            </button>
          </div>
        </div>

        {/* 상태 메시지 */}
        {msg && (
          <div style={{
            fontSize: 11, padding: '6px 10px', borderRadius: 8, marginBottom: 10,
            background: status === 'backup' ? 'rgba(214,158,46,.1)' : 'var(--bg-raised)',
            color: status === 'backup' ? '#f6e05e' : 'var(--text-secondary)',
            border: `1px solid ${status === 'backup' ? '#d69e2e44' : 'var(--border)'}`,
          }}>
            {status === 'loading' && '⏳ '}{status === 'backup' && '⚠️ '}{status === 'ok' && '✅ '}{msg}
          </div>
        )}

        {status === 'loading' && !latest && <div className="spinner" />}

        {latest ? (
          <>
            <div className="ball-row" style={{ marginBottom: 10 }}>
              {latest.numbers.map(n => <Ball key={n} n={n} />)}
              <span className="plus-sign">+</span>
              <Ball n={latest.bonus} bonus />
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
              <span>🏆 1등 <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>{formatPrize(latest.prize1)}</span></span>
              <span>👤 당첨자 <span style={{ color: 'var(--text-primary)' }}>{latest.winners1 || '-'}명</span></span>
              {latest.source === 'backup' && (
                <span style={{ color: '#d69e2e' }}>* 저장 데이터</span>
              )}
            </div>
          </>
        ) : status !== 'loading' && (
          <div style={{
            textAlign: 'center', padding: '20px 0', fontSize: 13,
            color: 'var(--text-secondary)',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📡</div>
            <div>네트워크 연결 후 새로고침 해주세요</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
              Wi-Fi 또는 모바일 데이터 연결 필요
            </div>
          </div>
        )}
      </div>

      {/* 최근 당첨번호 목록 */}
      {draws.length > 1 && (
        <>
          <div className="section-label" style={{ marginTop: 20 }}>📋 최근 당첨번호</div>
          {draws.slice(1, 6).map(d => (
            <div key={d.round} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 8,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                <span style={{
                  fontSize: 12, color: 'var(--accent-gold)',
                  fontFamily: 'Orbitron,sans-serif', fontWeight: 700,
                }}>
                  {d.round}회
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{d.date}</span>
              </div>
              <div className="ball-row">
                {d.numbers.map(n => <Ball key={n} n={n} small />)}
                <span className="plus-sign" style={{ fontSize: 14 }}>+</span>
                <Ball n={d.bonus} small bonus />
              </div>
            </div>
          ))}
        </>
      )}

      {/* 당첨 구조 */}
      <div className="section-label" style={{ marginTop: 20 }}>📑 당첨 구조</div>
      <div className="card">
        {[
          { rank: '1등', match: '6개 번호 일치',     color: '#f5c842' },
          { rank: '2등', match: '5개 + 보너스 일치', color: '#a78bfa' },
          { rank: '3등', match: '5개 번호 일치',     color: '#63b3ed' },
          { rank: '4등', match: '4개 번호 일치',     color: '#68d391' },
          { rank: '5등', match: '3개 번호 일치',     color: '#fc8181' },
        ].map(item => (
          <div key={item.rank} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: 13,
          }}>
            <span style={{ color: item.color, fontWeight: 700 }}>{item.rank}</span>
            <span style={{ color: 'var(--text-secondary)' }}>{item.match}</span>
          </div>
        ))}
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 10 }}>
          매주 토요일 20:35 추첨 · 1게임 1,000원
        </div>
      </div>
    </div>
  );
}
