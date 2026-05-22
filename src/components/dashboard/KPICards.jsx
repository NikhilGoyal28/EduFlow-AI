import React, { useState, useEffect } from 'react';
import { getThemeStyles } from '../../constants/theme';

export default function KPICards({ leads, darkMode }) {
  const theme = getThemeStyles(darkMode);
  const [metrics, setMetrics] = useState(null);
  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API_URL}/insights`);
        const data = await res.json();
        if (data.status === 'success') setMetrics(data.metrics);
      } catch { /* offline — use computed values below */ }
    };
    fetchMetrics();
  }, [leads]);

  const enrollmentRate = leads.length > 0
    ? Math.round((leads.filter(l => l.status === 'Enrolled').length / leads.length) * 100) : 0;
  const conversionRate = leads.length > 0
    ? Math.round(((leads.filter(l => l.status === 'Interested').length + leads.filter(l => l.status === 'Enrolled').length) / leads.length) * 100) : 0;
  const avgPropensity = metrics?.avg_propensity ??
    (leads.filter(l => l.status !== 'Enrolled').length > 0
      ? Math.round(leads.filter(l => l.status !== 'Enrolled').reduce((s, l) => s + (l.ml_score ?? l.score ?? 50), 0) / leads.filter(l => l.status !== 'Enrolled').length)
      : 0);
  const modelAccuracy = metrics?.model_accuracy ?? null;
  const churnRisk = leads.filter(l => l.ml_risk || ((l.ml_score ?? l.score ?? 50) < 35 && l.status !== 'Enrolled')).length;
  const thisWeek = leads.filter(l => { const d = new Date(l.addedDate); const w = new Date(); w.setDate(w.getDate() - 7); return d > w; }).length;

  const kpis = [
    {
      label: 'Total Leads',
      value: leads.length,
      sub: `+${thisWeek} this week`,
      icon: '👥',
      color: '#3B82F6',
      gradient: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0) 100%)',
      border: 'rgba(59,130,246,0.2)'
    },
    {
      label: 'Enrollment Rate',
      value: `${enrollmentRate}%`,
      sub: `${leads.filter(l => l.status === 'Enrolled').length} enrolled`,
      icon: '🎓',
      color: '#10B981',
      gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0) 100%)',
      border: 'rgba(16,185,129,0.2)'
    },
    {
      label: 'ML Avg Propensity',
      value: `${avgPropensity}%`,
      sub: modelAccuracy !== null ? `Model accuracy: ${modelAccuracy}%` : 'RandomForest engine',
      icon: '🧠',
      color: '#8B5CF6',
      gradient: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0) 100%)',
      border: 'rgba(139,92,246,0.2)'
    },
    {
      label: 'Churn Risk Alerts',
      value: churnRisk,
      sub: churnRisk > 0 ? 'Needs immediate follow-up' : 'All leads healthy',
      icon: churnRisk > 0 ? '⚠️' : '✅',
      color: churnRisk > 0 ? '#EF4444' : '#10B981',
      gradient: churnRisk > 0
        ? 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0) 100%)'
        : 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0) 100%)',
      border: churnRisk > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '20px', marginBottom: '32px' }}>
      {kpis.map((kpi, idx) => (
        <div key={idx} className={`${theme.glassClass} hover-lift`} style={{
          borderRadius: '18px', padding: '24px', position: 'relative', overflow: 'hidden',
          border: `1px solid ${kpi.border}`, cursor: 'default'
        }}>
          {/* Gradient wash */}
          <div style={{ position: 'absolute', inset: 0, background: kpi.gradient, opacity: 0.7, zIndex: 0 }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <span style={{
                fontSize: '26px',
                background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                width: '48px', height: '48px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '12px', flexShrink: 0
              }}>{kpi.icon}</span>
              {/* Mini trend bar */}
              <div style={{
                height: '32px', width: '64px', display: 'flex', alignItems: 'flex-end', gap: '3px'
              }}>
                {[0.4, 0.6, 0.5, 0.75, 0.65, 0.9, 1].map((h, i) => (
                  <div key={i} style={{
                    flex: 1, borderRadius: '3px',
                    background: kpi.color,
                    height: `${h * 100}%`,
                    opacity: 0.3 + i * 0.1,
                    transition: 'height 0.6s ease'
                  }} />
                ))}
              </div>
            </div>

            <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: theme.textColorMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              {kpi.label}
            </p>
            <p style={{ margin: '0 0 6px 0', fontSize: '34px', fontWeight: '800', color: kpi.color, letterSpacing: '-1px', lineHeight: 1 }}>
              {kpi.value}
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: theme.textColorMuted, fontWeight: '500' }}>
              {kpi.sub}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
