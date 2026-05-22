import React from 'react';
import { getThemeStyles } from '../../constants/theme';

export default function AIInsights({ leads, darkMode }) {
  const theme = getThemeStyles(darkMode);
  const atRiskLeads = leads.filter(l => l.status === 'Contacted' || l.status === 'New').slice(0, 3);
  
  const insights = [
    {
      icon: '🧠',
      title: 'Conversion Intelligence',
      desc: 'WhatsApp referrals are converting 15% faster than Facebook leads this week.',
      type: 'positive'
    },
    {
      icon: '⚠️',
      title: 'Risk Detection',
      desc: `${atRiskLeads.length} high-intent students haven't received follow-ups in 48 hours.`,
      type: 'warning'
    },
    {
      icon: '⚡',
      title: 'Workflow Automation',
      desc: 'Auto-reminder workflow triggered for 12 pending document uploads.',
      type: 'info'
    }
  ];

  return (
    <div className={theme.glassClass} style={{
      borderRadius: '16px',
      padding: '32px',
      height: '100%'
    }}>
      <h3 style={{ 
        margin: '0 0 24px 0', 
        fontSize: '18px', 
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{
          background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>EduFlow AI</span> Operations Panel
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {insights.map((insight, idx) => (
          <div key={idx} style={{
            display: 'flex',
            gap: '16px',
            padding: '16px',
            background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            borderRadius: '12px',
            borderLeft: `4px solid ${
              insight.type === 'warning' ? '#F59E0B' : 
              insight.type === 'positive' ? '#10B981' : '#3B82F6'
            }`
          }}>
            <div style={{ fontSize: '24px' }}>{insight.icon}</div>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600' }}>{insight.title}</h4>
              <p style={{ margin: '0', fontSize: '13px', color: theme.textColorMuted, lineHeight: '1.5' }}>
                {insight.desc}
              </p>
            </div>
          </div>
        ))}

        {atRiskLeads.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: theme.textColorMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Action Required
            </h4>
            {atRiskLeads.map(lead => (
              <div key={lead.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                border: `1px solid ${theme.borderColor}`,
                borderRadius: '8px',
                marginBottom: '8px'
              }}>
                <div style={{ fontSize: '13px' }}>
                  <span style={{ fontWeight: '600' }}>{lead.name}</span>
                  <span style={{ color: theme.textColorMuted, marginLeft: '8px' }}>({lead.source})</span>
                </div>
                <button style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#EF4444',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>Auto-Ping</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
