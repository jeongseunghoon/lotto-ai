import { useState } from 'react';
import { loadSettings, saveSettings } from '../utils/lotto';

export default function SettingsTab() {
  const [s, setS]         = useState(loadSettings());
  const [apiKey, setApiKey] = useState(localStorage.getItem('lotto_api_key') || '');
  const [proxyUrl, setProxyUrl] = useState(localStorage.getItem('lotto_proxy_url') || '');
  const [saved, setSaved]   = useState('');

  function toggle(key) {
    const next = { ...s, [key]: !s[key] };
    setS(next);
    saveSettings(next);
  }

  function save() {
    localStorage.setItem('lotto_api_key',   apiKey.trim());
    localStorage.setItem('lotto_proxy_url', proxyUrl.trim());
    setSaved('저장됨!');
    setTimeout(() => setSaved(''), 2000);
  }

  return (
    <div className="content">
      <div className="section-label">⚙️ 설정</div>
      <div className="card">
        <div className="setting-row">
          <div>
            <div className="setting-label">🤖 AI 분석 사용</div>
            <div className="setting-desc">Claude AI API 호출 활성화</div>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={s.aiAnalysis} onChange={() => toggle('aiAnalysis')} />
            <span className="toggle-slider" />
          </label>
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-label">🌐 자동 데이터 업데이트</div>
            <div className="setting-desc">앱 실행 시 당첨번호 자동 업데이트</div>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={s.autoFetch} onChange={() => toggle('autoFetch')} />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

      {/* 프록시 서버 설정 */}
      <div className="section-label" style={{ marginTop: 20 }}>📡 당첨번호 프록시 서버</div>
      <div className="card">
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.7 }}>
          PC에서 <span style={{ color: 'var(--accent-gold)' }}>START_PROXY.bat</span> 실행 후<br />
          ngrok으로 외부 공개하면 실시간 당첨번호 수신 가능합니다.<br />
          <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>
            설치: npm install -g ngrok → ngrok http 3001
          </span>
        </div>
        <input
          type="text"
          value={proxyUrl}
          onChange={e => setProxyUrl(e.target.value)}
          placeholder="https://xxxx-xxx.ngrok-free.app"
          style={{
            width: '100%', padding: '12px 14px',
            background: 'var(--bg-raised)', border: '1px solid var(--border)',
            borderRadius: 10, color: 'var(--text-primary)', fontSize: 12,
            fontFamily: 'monospace', outline: 'none', marginBottom: 10,
          }}
        />
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 10 }}>
          비워두면 자동으로 여러 프록시를 시도합니다
        </div>
      </div>

      {/* Claude API 키 */}
      <div className="section-label" style={{ marginTop: 20 }}>🔑 Claude API 키</div>
      <div className="card">
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          AI 예측 기능에 필요합니다.<br />
          <a href="https://console.anthropic.com" style={{ color: 'var(--accent-cyan)' }}>
            console.anthropic.com
          </a>에서 무료 발급
        </div>
        <input
          type="password"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder="sk-ant-..."
          style={{
            width: '100%', padding: '12px 14px',
            background: 'var(--bg-raised)', border: '1px solid var(--border)',
            borderRadius: 10, color: 'var(--text-primary)', fontSize: 13,
            fontFamily: 'monospace', outline: 'none', marginBottom: 10,
          }}
        />
        <button className="btn-primary" onClick={save}>
          {saved || '저장'}
        </button>
      </div>

      {/* 앱 정보 */}
      <div className="section-label" style={{ marginTop: 20 }}>ℹ️ 앱 정보</div>
      <div className="card">
        {[
          ['앱 이름', '로또AI - 스마트 번호 예측'],
          ['버전', 'v1.0.0'],
          ['개발', 'Mr. Robot · com.mrrobot.lottoai'],
          ['문의', '010-2371-8701'],
          ['주의', '로또는 확률 게임입니다. 당첨을 보장하지 않습니다.'],
        ].map(([k, v]) => (
          <div key={k} className="setting-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: 1 }}>{k}</span>
            <span style={{ fontSize: 13 }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 11, color: 'var(--text-dim)' }}>
        © 2025 Mr. Robot · mrrobot-comas.netlify.app
      </div>
    </div>
  );
}
