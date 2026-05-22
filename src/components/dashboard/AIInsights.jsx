import React, { useState, useEffect } from 'react';
import { getThemeStyles } from '../../constants/theme';

export default function AIInsights({ leads, darkMode, onReengage }) {
  const theme = getThemeStyles(darkMode);
  const [insights, setInsights] = useState([]);
  const [modelAccuracy, setModelAccuracy] = useState(null);
  const [avgPropensity, setAvgPropensity] = useState(null);
  const API_URL = 'http://localhost:5000/api';

  // Fetch ML insights from backend
  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await fetch(`${API_URL}/insights`);
        const data = await res.json();
        if (data.status === 'success') {
          setInsights(data.metrics?.ml_insights || []);
          setModelAccuracy(data.metrics?.model_accuracy);
          setAvgPropensity(data.metrics?.avg_propensity);
        }
      } catch {
        // Offline: derive basic insights from local lead data
        setInsights(buildLocalInsights(leads));
      }
    };
    fetchInsights();
  }, [leads]);

  function buildLocalInsights(leads) {
    const atRisk = leads.filter(l => (l.ml_score ?? l.score ?? 50) < 35 && l.status !== 'Enrolled');
    const hot = leads.filter(l => (l.ml_score ?? l.score ?? 0) >= 70 && l.status !== 'Enrolled');
    const result = [];
    if (hot.length)
      result.push({ icon: '🔥', title: `${hot.length} High-Propensity Lead${hot.length > 1 ? 's' : ''}`, desc: `${hot.map(l => l.name).slice(0, 2).join(', ')} score 70%+ for conversion. Prioritise immediately.`, type: 'positive' });
    if (atRisk.length)
      result.push({ icon: '⚠️', title: `${atRisk.length} Lead${atRisk.length > 1 ? 's' : ''} Predicted to Churn`, desc: `ML model flags ${atRisk.length} leads at <35% propensity. Send follow-up now.`, type: 'warning' });
    if (!result.length)
      result.push({ icon: '✅', title: 'All Pipelines Healthy', desc: 'No immediate churn risk detected. ML model monitoring all leads.', type: 'positive' });
    return result;
  }

  const atRiskLeads = leads.filter(l => l.ml_risk || ((l.ml_score ?? l.score ?? 50) < 35 && l.status !== 'Enrolled')).slice(0, 3);
  const insightColor = { positive: '#10B981', warning: '#F59E0B', info: '#3B82F6' };
  const insightBg   = { positive: 'rgba(16,185,129,0.08)', warning: 'rgba(245,158,11,0.08)', info: 'rgba(59,130,246,0.08)' };

  return (
    <div className={theme.glassClass} style={{ borderRadius: '20px', padding: '28px', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ML Intelligence
          </span>
          Panel
        </h3>
        {modelAccuracy !== null && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: theme.textColorMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Model Accuracy
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#10B981' }}>
              {modelAccuracy}%
            </div>
          </div>
        )}
      </div>

      {/* Avg Propensity Mini-Banner */}
      {avgPropensity !== null && (
        <div style={{
          background: darkMode ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.08)',
          border: '1px solid rgba(139,92,246,0.25)',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '12px', color: theme.textColorMuted, fontWeight: '600' }}>Avg Conversion Propensity</div>
            <div style={{ fontSize: '10px', color: theme.textColorMuted, marginTop: '2px' }}>Across all active leads</div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#8B5CF6' }}>{avgPropensity}%</div>
        </div>
      )}

      {/* ML Insight Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {(insights.length ? insights : buildLocalInsights(leads)).map((insight, idx) => (
          <div key={idx} style={{
            display: 'flex',
            gap: '14px',
            padding: '14px',
            background: insightBg[insight.type] || insightBg.info,
            borderRadius: '12px',
            borderLeft: `3px solid ${insightColor[insight.type] || insightColor.info}`,
            transition: 'transform 0.2s ease',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateX(3px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
          >
            <div style={{ fontSize: '22px', flexShrink: 0 }}>{insight.icon}</div>
            <div>
              <h4 style={{ margin: '0 0 3px 0', fontSize: '13px', fontWeight: '700' }}>{insight.title}</h4>
              <p style={{ margin: 0, fontSize: '12px', color: theme.textColorMuted, lineHeight: '1.5' }}>{insight.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* At-Risk Action Queue */}
      {atRiskLeads.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '11px', color: theme.textColorMuted, textTransform: 'uppercase', letterSpacing: '0.7px', fontWeight: '700' }}>
            🚨 Churn Risk Queue
          </h4>
          {atRiskLeads.map(lead => (
            <div key={lead.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              border: `1px solid rgba(239,68,68,0.2)`,
              background: 'rgba(239,68,68,0.05)',
              borderRadius: '10px',
              marginBottom: '8px',
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600' }}>{lead.name}</div>
                <div style={{ fontSize: '11px', color: '#EF4444', fontWeight: '600', marginTop: '2px' }}>
                  {lead.ml_score ?? lead.score ?? '?'}% propensity · {lead.source}
                </div>
              </div>
              <button
                onClick={() => onReengage(lead)}
                style={{
                  background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 6px 16px rgba(239,68,68,0.4)'; }}
                onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 4px 12px rgba(239,68,68,0.3)'; }}
              >
                Auto-Ping ⚡
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
