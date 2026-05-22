import React from 'react';
import { sourceColors } from '../../constants/theme';

// Helper to render propensity badge
const getPropensityBadge = (score) => {
  let color, bg, border, emoji, label, glow;
  if (score >= 75) { color = '#EF4444'; bg = 'rgba(239,68,68,0.12)'; border = 'rgba(239,68,68,0.35)'; emoji = '🔥'; label = 'Hot'; glow = '0 0 14px rgba(239,68,68,0.25)'; }
  else if (score >= 50) { color = '#8B5CF6'; bg = 'rgba(139,92,246,0.12)'; border = 'rgba(139,92,246,0.35)'; emoji = '⚡'; label = 'Warm'; glow = 'none'; }
  else if (score >= 30) { color = '#F59E0B'; bg = 'rgba(245,158,11,0.12)'; border = 'rgba(245,158,11,0.35)'; emoji = '🌡️'; label = 'Lukewarm'; glow = 'none'; }
  else { color = '#64748B'; bg = 'rgba(100,116,139,0.1)'; border = 'rgba(100,116,139,0.25)'; emoji = '❄️'; label = 'Cold'; glow = 'none'; }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '5px 11px', borderRadius: '20px',
        background: bg, color, fontSize: '12px', fontWeight: '700',
        border: `1px solid ${border}`, boxShadow: glow,
        whiteSpace: 'nowrap'
      }}>
        {emoji} {score}%
      </span>
      <span style={{ fontSize: '10px', color, fontWeight: '600', textAlign: 'center', opacity: 0.9 }}>{label}</span>
    </div>
  );
};

// Mini bar below badge
const PropensityBar = ({ score }) => {
  const clr = score >= 75 ? '#EF4444' : score >= 50 ? '#8B5CF6' : score >= 30 ? '#F59E0B' : '#64748B';
  return (
    <div style={{ width: '60px', height: '4px', borderRadius: '4px', background: 'rgba(100,116,139,0.15)', overflow: 'hidden' }}>
      <div style={{ width: `${score}%`, height: '100%', background: clr, borderRadius: '4px', transition: 'width 0.6s ease' }} />
    </div>
  );
};

const LeadRow = React.memo(({ lead, onStatusChange, onDeleteLead, onReengage, darkMode, theme }) => {
  const mlScore = lead.ml_score ?? lead.score ?? 0;
  const rowBg = lead.ml_risk
    ? (darkMode ? 'rgba(239,68,68,0.05)' : 'rgba(239,68,68,0.03)')
    : (darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)');

  return (
    <tr style={{ background: rowBg, transition: 'all 0.2s ease' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.002)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}>
      {/* Name */}
      <td style={{ padding: '14px 14px', borderRadius: '12px 0 0 12px', fontWeight: '600' }}>
        {lead.ml_risk && <span style={{ fontSize: '10px', color: '#EF4444', fontWeight: '700', display: 'block', marginBottom: '2px' }}>⚠ CHURN RISK</span>}
        {lead.name}
      </td>
      {/* Email */}
      <td style={{ padding: '14px', color: theme.textColorMuted, fontSize: '13px' }}>{lead.email}</td>
      {/* Source */}
      <td style={{ padding: '14px' }}>
        <span style={{
          display: 'inline-block', padding: '5px 11px', borderRadius: '20px',
          background: `${sourceColors[lead.source]}20`, color: sourceColors[lead.source],
          fontSize: '12px', fontWeight: '700', border: `1px solid ${sourceColors[lead.source]}40`
        }}>{lead.source}</span>
      </td>
      {/* ML Propensity */}
      <td style={{ padding: '14px', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          {getPropensityBadge(mlScore)}
          <PropensityBar score={mlScore} />
        </div>
      </td>
      {/* Status */}
      <td style={{ padding: '14px' }}>
        <select value={lead.status} onChange={e => onStatusChange(lead.id, e.target.value)}
          style={{
            padding: '7px 12px', borderRadius: '8px',
            border: `1px solid ${theme.borderColor}`,
            background: theme.inputBackground, color: theme.color,
            cursor: 'pointer', fontSize: '13px', fontWeight: '600'
          }}>
          <option value="New">🆕 New</option>
          <option value="Contacted">📞 Contacted</option>
          <option value="Interested">⚡ Interested</option>
          <option value="Enrolled">🎓 Enrolled</option>
        </select>
      </td>
      {/* Added Date */}
      <td style={{ padding: '14px', color: theme.textColorMuted, fontSize: '13px' }}>{lead.addedDate}</td>
      {/* Actions */}
      <td style={{ padding: '14px', textAlign: 'center', borderRadius: '0 12px 12px 0', minWidth: '180px' }}>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button
            onClick={() => onReengage(lead)}
            style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'none', borderRadius: '8px', padding: '7px 13px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', transition: 'all 0.2s ease' }}
            onMouseEnter={e => { e.target.style.background = '#3B82F6'; e.target.style.color = 'white'; }}
            onMouseLeave={e => { e.target.style.background = 'rgba(59,130,246,0.1)'; e.target.style.color = '#3B82F6'; }}>
            Ping ⚡
          </button>
          <button
            onClick={() => onDeleteLead(lead.id)}
            style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: '8px', padding: '7px 13px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', transition: 'all 0.2s ease' }}
            onMouseEnter={e => { e.target.style.background = '#EF4444'; e.target.style.color = 'white'; }}
            onMouseLeave={e => { e.target.style.background = 'rgba(239,68,68,0.1)'; e.target.style.color = '#EF4444'; }}>
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
});

export default LeadRow;
