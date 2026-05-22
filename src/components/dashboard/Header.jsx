import React, { useState, useEffect } from 'react';
import { getThemeStyles } from '../../constants/theme';

export default function Header({ darkMode, setDarkMode }) {
  const theme = getThemeStyles(darkMode);
  const [mlStatus, setMlStatus] = useState(null); // { accuracy, model }
  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    fetch(`${API_URL}/insights`)
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') {
          setMlStatus({ accuracy: d.metrics?.model_accuracy });
        }
      })
      .catch(() => {});
  }, []);

  const syncSheets = async () => {
    try {
      const res = await fetch(`${API_URL}/sync-sheets`, { method: 'POST' });
      const data = await res.json();
      alert(data.message || 'Sync complete!');
    } catch {
      alert('Sheets sync failed. Check credentials.json in backend/.');
    }
  };

  return (
    <div className={theme.glassClass} style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: '28px', padding: '20px 28px',
      borderRadius: '20px',
    }}>
      <div>
        <h1 style={{
          margin: '0 0 6px 0', fontSize: '30px', fontWeight: '800',
          background: theme.gradientText,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.5px'
        }}>
          EduFlow AI Command Center
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <p style={{ margin: 0, fontSize: '14px', color: theme.textColorMuted, fontWeight: '500' }}>
            Real-time Lead Management · ML-Powered Predictive Analytics
          </p>
          {mlStatus && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
              background: 'rgba(16,185,129,0.12)', color: '#10B981',
              border: '1px solid rgba(16,185,129,0.3)'
            }}>
              🧠 RandomForest · {mlStatus.accuracy}% accuracy
            </span>
          )}
          {!mlStatus && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
              background: 'rgba(245,158,11,0.12)', color: '#F59E0B',
              border: '1px solid rgba(245,158,11,0.3)'
            }}>
              ⚡ Offline Mode · Local Snapshot
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {/* Google Sheets Sync */}
        <button
          onClick={syncSheets}
          className="hover-lift"
          title="Sync leads to Google Sheets"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
            color: '#10B981',
            border: '1px solid rgba(16,185,129,0.3)',
            padding: '10px 18px', borderRadius: '12px',
            cursor: 'pointer', fontSize: '13px', fontWeight: '700',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          📊 Sync Sheets
        </button>

        {/* Dark / Light toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="hover-lift"
          style={{
            background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            color: theme.color,
            border: `1px solid ${theme.borderColor}`,
            padding: '10px 18px', borderRadius: '12px',
            cursor: 'pointer', fontSize: '13px', fontWeight: '600',
            backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          {darkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>
    </div>
  );
}
