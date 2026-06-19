import { useState, useEffect } from 'react';
import HomeTab     from './tabs/HomeTab';
import PredictTab  from './tabs/PredictTab';
import StatsTab    from './tabs/StatsTab';
import HistoryTab  from './tabs/HistoryTab';
import SettingsTab from './tabs/SettingsTab';
import { loadHistory } from './utils/lotto';

const TABS = [
  { key: 'home',     icon: '🏠', label: '홈' },
  { key: 'predict',  icon: '🎯', label: '예측' },
  { key: 'stats',    icon: '📊', label: '통계' },
  { key: 'history',  icon: '📂', label: '히스토리' },
  { key: 'settings', icon: '⚙️',  label: '설정' },
];

export default function App() {
  const [tab, setTab] = useState('home');
  const [histCount, setHistCount] = useState(0);

  useEffect(() => {
    setHistCount(loadHistory().length);
  }, [tab]);

  return (
    <>
      {/* Header */}
      <div className="header">
        <div>
          <div className="header-logo">LOTTO AI</div>
          <div className="header-sub">Mr. Robot · 스마트 번호 예측</div>
        </div>
        <div style={{ fontSize: 26 }}>🤖</div>
      </div>

      {/* Tab bar */}
      <div className="tab-bar">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`tab-btn ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            <span className="tab-icon">{t.icon}</span>
            <span style={{ position: 'relative' }}>
              {t.label}
              {t.key === 'history' && histCount > 0 && (
                <span style={{
                  position: 'absolute', top: -8, right: -12,
                  background: 'var(--accent-red)', color: '#fff',
                  borderRadius: 10, fontSize: 9, padding: '1px 4px',
                  fontWeight: 700,
                }}>
                  {histCount}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'home'     && <HomeTab />}
      {tab === 'predict'  && <PredictTab />}
      {tab === 'stats'    && <StatsTab />}
      {tab === 'history'  && <HistoryTab />}
      {tab === 'settings' && <SettingsTab />}
    </>
  );
}
