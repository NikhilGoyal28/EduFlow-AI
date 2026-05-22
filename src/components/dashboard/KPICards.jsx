import React from 'react';
import { getThemeStyles } from '../../constants/theme';

export default function KPICards({ leads, darkMode }) {
  const theme = getThemeStyles(darkMode);

  const enrollmentRate = leads.length > 0 
    ? Math.round((leads.filter(l => l.status === 'Enrolled').length / leads.length) * 100)
    : 0;

  const conversionRate = leads.length > 0
    ? Math.round(((leads.filter(l => l.status === 'Interested').length + leads.filter(l => l.status === 'Enrolled').length) / leads.length) * 100)
    : 0;

  const thisWeekCount = leads.filter(l => {
    const leadDate = new Date(l.addedDate);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return leadDate > weekAgo;
  }).length;

  const kpis = [
    { label: 'Total Leads', value: leads.length, icon: '👥', color: '#3B82F6', gradient: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0) 100%)' },
    { label: 'Enrollment Rate', value: `${enrollmentRate}%`, icon: '🎓', color: '#10B981', gradient: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0) 100%)' },
    { label: 'Conversion Rate', value: `${conversionRate}%`, icon: '📈', color: '#8B5CF6', gradient: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(139,92,246,0) 100%)' },
    { label: 'New This Week', value: thisWeekCount, icon: '🔥', color: '#F59E0B', gradient: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0) 100%)' }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '24px',
      marginBottom: '32px'
    }}>
      {kpis.map((kpi, idx) => (
        <div
          key={idx}
          className={`${theme.glassClass} hover-lift`}
          style={{
            borderRadius: '16px',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: kpi.gradient,
            opacity: 0.5,
            zIndex: 0
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <span style={{ 
                fontSize: '28px',
                background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px'
              }}>{kpi.icon}</span>
            </div>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: theme.textColorMuted, fontWeight: '600' }}>
              {kpi.label}
            </p>
            <p style={{ margin: '0', fontSize: '36px', fontWeight: '800', color: kpi.color, letterSpacing: '-1px' }}>
              {kpi.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
