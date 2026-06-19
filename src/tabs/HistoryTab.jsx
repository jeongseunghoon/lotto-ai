import { useState, useEffect } from 'react';
import Ball from '../components/Ball';
import QRCode from 'react-qr-code';
import { loadHistory, saveHistory, loadDraws, sortNums } from '../utils/lotto';

export default function HistoryTab() {
  const [list, setList]         = useState([]);
  const [qrTarget, setQrTarget] = useState(null);
  const [checkMode, setCheckMode] = useState(false);
  const [checked, setChecked]   = useState({}); // id → match count

  useEffect(() => { setList(loadHistory()); }, []);

  function del(id) {
    const next = list.filter(i => i.id !== id);
    setList(next);
    saveHistory(next);
  }

  function clearAll() {
    if (window.confirm('저장된 번호를 모두 삭제할까요?')) {
      setList([]);
      saveHistory([]);
      setChecked({});
    }
  }

  // 최신 당첨번호와 비교
  function checkAll() {
    const draws = loadDraws();
    if (!draws.length) {
      alert('홈 탭에서 당첨 데이터를 먼저 불러오세요.');
      return;
    }
    const latest = draws[0];
    const result = {};
    list.forEach(item => {
      const match = item.numbers.filter(n => latest.numbers.includes(n)).length;
      const bonus = item.numbers.includes(latest.bonus);
      result[item.id] = { match, bonus, round: latest.round };
    });
    setChecked(result);
    setCheckMode(true);
  }

  function rankLabel(match, bonus) {
    if (match === 6) return { label: '🏆 1등!', color: '#f5c842' };
    if (match === 5 && bonus) return { label: '🥈 2등!', color: '#a78bfa' };
    if (match === 5) return { label: '🥉 3등!', color: '#63b3ed' };
    if (match === 4) return { label: '4등', color: '#68d391' };
    if (match === 3) return { label: '5등', color: '#fc8181' };
    return { label: `${match}개 일치`, color: 'var(--text-secondary)' };
  }

  return (
    <div className="content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="section-label" style={{ marginBottom: 0 }}>
          📂 저장된 번호 {list.length > 0 && <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>({list.length}세트)</span>}
        </div>
        {list.length > 0 && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn-cyan"
              style={{ padding: '6px 10px', fontSize: 11 }}
              onClick={checkMode ? () => { setCheckMode(false); setChecked({}); } : checkAll}
            >
              {checkMode ? '확인 종료' : '🎯 당첨 확인'}
            </button>
            <button
              className="btn-secondary"
              style={{ padding: '6px 10px', fontSize: 11, color: 'var(--accent-red)', borderColor: 'var(--accent-red)' }}
              onClick={clearAll}
            >
              전체 삭제
            </button>
          </div>
        )}
      </div>

      {checkMode && (
        <div style={{
          background: 'rgba(0,229,255,.07)', border: '1px solid var(--accent-cyan)',
          borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12,
          color: 'var(--accent-cyan)',
        }}>
          🎯 최신 당첨번호와 비교 중 — {Object.values(checked).find(c => c.round)?.round}회 기준
        </div>
      )}

      {list.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-text">
            저장된 번호가 없습니다.<br />
            예측 탭에서 번호를 생성하고<br />저장 버튼을 눌러주세요.
          </div>
        </div>
      ) : (
        list.map(item => {
          const cr = checked[item.id];
          const rank = cr ? rankLabel(cr.match, cr.bonus) : null;
          return (
            <div key={item.id} className="history-item" style={{
              borderColor: rank && cr.match >= 3 ? rank.color : 'var(--border)',
            }}>
              <div className="history-meta">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="ai-badge">{item.method}</span>
                  <span>신뢰도 {item.confidence}%</span>
                  {rank && (
                    <span style={{ color: rank.color, fontWeight: 700, fontSize: 12 }}>{rank.label}</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10 }}>{item.savedAt}</span>
                  <button className="history-delete" onClick={() => del(item.id)}>×</button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="ball-row">
                  {item.numbers.map(n => (
                    <div key={n} style={{
                      outline: cr && (loadDraws()[0]?.numbers.includes(n)) ? '2px solid #68d391' : 'none',
                      outlineOffset: 2,
                      borderRadius: '50%',
                    }}>
                      <Ball n={n} small />
                    </div>
                  ))}
                </div>
                <button
                  className="btn-cyan"
                  style={{ padding: '5px 10px', fontSize: 11, flexShrink: 0 }}
                  onClick={() => setQrTarget(
                    `로또AI 저장번호\n${item.numbers.join(' ')}\n${item.method} · ${item.savedAt}`
                  )}
                >
                  QR
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* QR 모달 */}
      {qrTarget && (
        <div className="modal-overlay" onClick={() => setQrTarget(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">📱 번호 QR 코드</div>
            <div style={{ background: '#fff', padding: 16, borderRadius: 12, display: 'inline-block' }}>
              <QRCode value={qrTarget} size={180} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.8 }}>
              {qrTarget.split('\n').map((l, i) => <div key={i}>{l}</div>)}
            </div>
            <button className="modal-close" onClick={() => setQrTarget(null)}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}
