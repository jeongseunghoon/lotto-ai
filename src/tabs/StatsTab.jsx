import { useState, useEffect } from 'react';
import Ball from '../components/Ball';
import { analyzeFrequency, getHotCold, loadDraws, ballClass } from '../utils/lotto';

export default function StatsTab() {
  const [draws, setDraws]   = useState([]);
  const [freq, setFreq]     = useState({});
  const [hotCold, setHC]    = useState({ hot: [], cold: [] });
  const [view, setView]     = useState('hot'); // hot | cold | grid | dist

  useEffect(() => {
    const d = loadDraws();
    setDraws(d);
    if (d.length) {
      const f = analyzeFrequency(d);
      setFreq(f);
      setHC(getHotCold(f));
    }
  }, []);

  if (!draws.length) return (
    <div className="content">
      <div className="empty-state">
        <div className="empty-icon">📊</div>
        <div className="empty-text">
          홈 탭 → 새로고침으로<br />당첨 데이터를 먼저 불러와 주세요.
        </div>
      </div>
    </div>
  );

  // 구간별 분포
  const sections = [
    { label: '1-10', color: '#e53e3e', nums: Array.from({ length: 10 }, (_, i) => i + 1) },
    { label: '11-20', color: '#dd6b20', nums: Array.from({ length: 10 }, (_, i) => i + 11) },
    { label: '21-30', color: '#d69e2e', nums: Array.from({ length: 10 }, (_, i) => i + 21) },
    { label: '31-40', color: '#38a169', nums: Array.from({ length: 10 }, (_, i) => i + 31) },
    { label: '41-45', color: '#3182ce', nums: Array.from({ length: 5 }, (_, i) => i + 41) },
  ];

  const maxCount = Math.max(...Object.values(freq).map(v => v.count || 0));
  const totalDraws = draws.length;

  // 구간별 총 출현 수
  const sectionCounts = sections.map(s => ({
    ...s,
    count: s.nums.reduce((acc, n) => acc + (freq[n]?.count || 0), 0),
    max: s.nums.length * totalDraws,
  }));
  const maxSection = Math.max(...sectionCounts.map(s => s.count));

  return (
    <div className="content">
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
        분석 기반: 최근 <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>{totalDraws}회</span> 당첨 데이터
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { k: 'hot', l: '🔥 핫넘버' },
          { k: 'cold', l: '🧊 콜드넘버' },
          { k: 'grid', l: '📋 전체 빈도' },
          { k: 'dist', l: '📦 구간 분포' },
        ].map(t => (
          <button key={t.k} onClick={() => setView(t.k)} style={{
            padding: '7px 12px', borderRadius: 20, fontSize: 12,
            border: `1px solid ${view === t.k ? 'var(--accent-cyan)' : 'var(--border)'}`,
            background: view === t.k ? 'rgba(0,229,255,.1)' : 'var(--bg-card)',
            color: view === t.k ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>{t.l}</button>
        ))}
      </div>

      {/* 핫넘버 */}
      {view === 'hot' && (
        <div className="card">
          <div className="card-title">🔥 출현 빈도 TOP 10</div>
          {hotCold.hot.map((n, i) => (
            <div key={n} className="stat-item">
              <div className="stat-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)', minWidth: 20 }}>#{i + 1}</span>
                  <Ball n={n} small />
                  <span style={{ fontSize: 13 }}>{n}번</span>
                </div>
                <span style={{ color: 'var(--accent-gold)' }}>{freq[n]?.count || 0}회</span>
              </div>
              <div className="stat-bar">
                <div className="stat-fill" style={{
                  width: `${((freq[n]?.count || 0) / maxCount) * 100}%`,
                  background: `linear-gradient(90deg, var(--accent-gold), #e6a817)`,
                }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 콜드넘버 */}
      {view === 'cold' && (
        <div className="card">
          <div className="card-title">🧊 출현 빈도 BOTTOM 10</div>
          {hotCold.cold.map((n, i) => (
            <div key={n} className="stat-item">
              <div className="stat-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)', minWidth: 20 }}>#{i + 1}</span>
                  <Ball n={n} small />
                  <span style={{ fontSize: 13 }}>{n}번</span>
                </div>
                <span style={{ color: 'var(--accent-cyan)' }}>{freq[n]?.count || 0}회</span>
              </div>
              <div className="stat-bar">
                <div className="stat-fill" style={{
                  width: `${((freq[n]?.count || 0) / maxCount) * 100}%`,
                  background: `linear-gradient(90deg, var(--accent-cyan), #00b8cc)`,
                }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 전체 빈도 그리드 */}
      {view === 'grid' && (
        <div className="card">
          <div className="card-title">📋 1-45 전체 출현 빈도</div>
          <div className="num-grid">
            {Array.from({ length: 45 }, (_, i) => i + 1).map(n => {
              const count = freq[n]?.count || 0;
              const intensity = maxCount ? count / maxCount : 0;
              const cls = ballClass(n);
              const bgMap = { b1: '#c0392b', b2: '#d46b08', b3: '#b8860b', b4: '#276749', b5: '#2b6cb0' };
              const baseColor = bgMap[cls] || '#333';
              return (
                <div key={n} className="num-cell" style={{
                  background: `rgba(${hexToRgb(baseColor)},${0.2 + intensity * 0.8})`,
                  color: intensity > 0.3 ? '#fff' : 'var(--text-secondary)',
                  fontSize: 9,
                  flexDirection: 'column',
                  gap: 1,
                }}>
                  <span style={{ fontWeight: 700 }}>{n}</span>
                  <span style={{ fontSize: 8, opacity: .8 }}>{count}</span>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 12, display: 'flex', gap: 12 }}>
            <span>진할수록 = 출현 많음</span>
          </div>
        </div>
      )}

      {/* 구간 분포 */}
      {view === 'dist' && (
        <div className="card">
          <div className="card-title">📦 번호 구간별 출현 분포</div>
          {sectionCounts.map(s => (
            <div key={s.label} className="stat-item">
              <div className="stat-header">
                <span style={{ color: s.color, fontWeight: 700 }}>{s.label}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{s.count}회 / 총 {s.max}회 가능</span>
              </div>
              <div className="stat-bar">
                <div className="stat-fill" style={{
                  width: `${(s.count / maxSection) * 100}%`,
                  background: s.color,
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
