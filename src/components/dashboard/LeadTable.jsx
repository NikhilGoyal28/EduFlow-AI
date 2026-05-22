import React, { useState } from 'react';
import { sourceColors, getThemeStyles } from '../../constants/theme';

export default function LeadTable({ leads, filter, setFilter, onStatusChange, onDeleteLead, onReengage, darkMode }) {
  const theme = getThemeStyles(darkMode);
  const [sortBy, setSortBy] = useState('score');
  const [sortDirection, setSortDirection] = useState('desc');
  const [search, setSearch] = useState('');

  const filteredLeads = leads
    .filter(l => filter === 'All' || l.source === filter)
    .filter(l =>
      !search ||
      l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.email?.toLowerCase().includes(search.toLowerCase())
    );

  const handleSort = (field) => {
    if (sortBy === field) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDirection('desc'); }
  };

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    let aVal = sortBy === 'score' ? (a.ml_score ?? a.score ?? 0) : (a[sortBy] ?? '');
    let bVal = sortBy === 'score' ? (b.ml_score ?? b.score ?? 0) : (b[sortBy] ?? '');
    if (typeof aVal === 'string') return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  // ── ML Propensity Badge ──────────────────────────────────────────────────
  const getPropensityBadge = (score) => {
    let color, bg, border, emoji, label, glow;
    if (score >= 75) {
      color = '#EF4444'; bg = 'rgba(239,68,68,0.12)'; border = 'rgba(239,68,68,0.35)';
      emoji = '🔥'; label = 'Hot'; glow = '0 0 14px rgba(239,68,68,0.25)';
    } else if (score >= 50) {
      color = '#8B5CF6'; bg = 'rgba(139,92,246,0.12)'; border = 'rgba(139,92,246,0.35)';
      emoji = '⚡'; label = 'Warm'; glow = 'none';
    } else if (score >= 30) {
      color = '#F59E0B'; bg = 'rgba(245,158,11,0.12)'; border = 'rgba(245,158,11,0.35)';
      emoji = '🌡️'; label = 'Lukewarm'; glow = 'none';
    } else {
      color = '#64748B'; bg = 'rgba(100,116,139,0.1)'; border = 'rgba(100,116,139,0.25)';
      emoji = '❄️'; label = 'Cold'; glow = 'none';
    }
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
        <span style={{ fontSize: '10px', color, fontWeight: '600', textAlign: 'center', opacity: 0.9 }}>
          {label}
        </span>
      </div>
    );
  };

  // ── Propensity mini-bar ──────────────────────────────────────────────────
  const PropensityBar = ({ score }) => {
    const clr = score >= 75 ? '#EF4444' : score >= 50 ? '#8B5CF6' : score >= 30 ? '#F59E0B' : '#64748B';
    return (
      <div style={{ width: '60px', height: '4px', borderRadius: '4px', background: 'rgba(100,116,139,0.15)', overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: clr, borderRadius: '4px', transition: 'width 0.6s ease' }} />
      </div>
    );
  };

  const renderSortHeader = (label, field, alignment = 'left') => {
    const isCurrent = sortBy === field;
    return (
      <th onClick={() => handleSort(field)} style={{
        padding: '0 14px 10px 14px', textAlign: alignment,
        fontWeight: '700', fontSize: '12px',
        color: isCurrent ? theme.color : theme.textColorMuted,
        cursor: 'pointer', userSelect: 'none', transition: 'color 0.2s ease',
        textTransform: 'uppercase', letterSpacing: '0.5px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: alignment === 'center' ? 'center' : 'flex-start' }}>
          {label} {isCurrent ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
        </div>
      </th>
    );
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Source', 'ML Propensity', 'Status', 'Added Date'];
    const rows = sortedLeads.map(l => [l.name, l.email, l.source, `${l.ml_score ?? l.score}%`, l.status, l.addedDate]);
    const csv = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const a = document.createElement('a');
    a.setAttribute('href', encodeURI(csv));
    a.setAttribute('download', `eduflow_leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const exportToJSON = () => {
    const json = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(sortedLeads, null, 2))}`;
    const a = document.createElement('a');
    a.setAttribute('href', json);
    a.setAttribute('download', `eduflow_leads_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <div className={theme.glassClass} style={{ borderRadius: '20px', padding: '32px' }}>
      {/* ── Header Row ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '700' }}>
            Lead Pipeline{' '}
            <span style={{ color: theme.textColorMuted, fontSize: '15px', fontWeight: '500' }}>({filteredLeads.length})</span>
          </h2>
          <p style={{ margin: 0, fontSize: '12px', color: theme.textColorMuted }}>
            ML propensity scores powered by RandomForest · 10s live sync
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <input
            type="text"
            placeholder="🔍  Search leads..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '8px 14px', borderRadius: '10px',
              border: `1px solid ${theme.borderColor}`,
              background: theme.inputBackground,
              color: theme.color, fontSize: '13px', width: '180px'
            }}
          />

          {/* Source filter */}
          <div style={{
            display: 'flex', gap: '6px',
            background: darkMode ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.6)',
            padding: '4px', borderRadius: '12px',
            border: `1px solid ${theme.borderColor}`
          }}>
            {['All', 'Facebook', 'Website', 'WhatsApp'].map(src => (
              <button key={src} onClick={() => setFilter(src)} style={{
                padding: '7px 14px', borderRadius: '8px', border: 'none',
                background: filter === src ? (sourceColors[src] || '#3B82F6') : 'transparent',
                color: filter === src ? 'white' : theme.textColorMuted,
                cursor: 'pointer', fontWeight: filter === src ? '700' : '500',
                fontSize: '13px', transition: 'all 0.2s ease'
              }}>
                {src}
              </button>
            ))}
          </div>

          {/* Export buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { label: '📥 CSV', onClick: exportToCSV, color: '#10B981' },
              { label: '📋 JSON', onClick: exportToJSON, color: '#3B82F6' },
            ].map(({ label, onClick, color }) => (
              <button key={label} onClick={onClick} style={{
                padding: '8px 14px', borderRadius: '10px',
                border: `1px solid ${color}40`,
                background: `${color}15`, color,
                cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s ease'
              }}
                onMouseEnter={e => { e.target.style.background = color; e.target.style.color = 'white'; }}
                onMouseLeave={e => { e.target.style.background = `${color}15`; e.target.style.color = color; }}
              >{label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ overflowX: 'auto' }}>
        {sortedLeads.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px', fontSize: '14px' }}>
            <thead>
              <tr>
                {renderSortHeader('Name', 'name')}
                <th style={{ padding: '0 14px 10px', textAlign: 'left', fontWeight: '700', fontSize: '12px', color: theme.textColorMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</th>
                {renderSortHeader('Source', 'source')}
                {renderSortHeader('ML Propensity ↑', 'score', 'center')}
                {renderSortHeader('Status', 'status')}
                {renderSortHeader('Added', 'addedDate')}
                <th style={{ padding: '0 14px 10px', textAlign: 'center', fontWeight: '700', fontSize: '12px', color: theme.textColorMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedLeads.map(lead => {
                const mlScore = lead.ml_score ?? lead.score ?? 0;
                const rowBg = lead.ml_risk
                  ? (darkMode ? 'rgba(239,68,68,0.05)' : 'rgba(239,68,68,0.03)')
                  : (darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)');
                return (
                  <tr key={lead.id} style={{ background: rowBg, transition: 'all 0.2s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.002)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
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
                      }}>
                        {lead.source}
                      </span>
                    </td>
                    {/* ML Propensity */}
                    <td style={{ padding: '14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        {getPropensityBadge(mlScore)}
                        <PropensityBar score={mlScore} />
                      </div>
                    </td>
                    {/* Status dropdown */}
                    <td style={{ padding: '14px' }}>
                      <select
                        value={lead.status}
                        onChange={e => onStatusChange(lead.id, e.target.value)}
                        style={{
                          padding: '7px 12px', borderRadius: '8px',
                          border: `1px solid ${theme.borderColor}`,
                          background: theme.inputBackground, color: theme.color,
                          cursor: 'pointer', fontSize: '13px', fontWeight: '600'
                        }}
                      >
                        <option value="New">🆕 New</option>
                        <option value="Contacted">📞 Contacted</option>
                        <option value="Interested">⚡ Interested</option>
                        <option value="Enrolled">🎓 Enrolled</option>
                      </select>
                    </td>
                    {/* Date */}
                    <td style={{ padding: '14px', color: theme.textColorMuted, fontSize: '13px' }}>{lead.addedDate}</td>
                    {/* Actions */}
                    <td style={{ padding: '14px', textAlign: 'center', borderRadius: '0 12px 12px 0', minWidth: '180px' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => onReengage(lead)}
                          style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'none', borderRadius: '8px', padding: '7px 13px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', transition: 'all 0.2s ease' }}
                          onMouseEnter={e => { e.target.style.background = '#3B82F6'; e.target.style.color = 'white'; }}
                          onMouseLeave={e => { e.target.style.background = 'rgba(59,130,246,0.1)'; e.target.style.color = '#3B82F6'; }}
                        >Ping ⚡</button>
                        <button
                          onClick={() => onDeleteLead(lead.id)}
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: '8px', padding: '7px 13px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', transition: 'all 0.2s ease' }}
                          onMouseEnter={e => { e.target.style.background = '#EF4444'; e.target.style.color = 'white'; }}
                          onMouseLeave={e => { e.target.style.background = 'rgba(239,68,68,0.1)'; e.target.style.color = '#EF4444'; }}
                        >Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '56px', border: `2px dashed ${theme.borderColor}`, borderRadius: '16px' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '32px' }}>🧠</p>
            <p style={{ margin: '0 0 6px 0', fontWeight: '700', fontSize: '16px' }}>ML Engine Ready</p>
            <p style={{ margin: 0, color: theme.textColorMuted, fontWeight: '500', fontSize: '14px' }}>
              Add a lead and the RandomForest model will instantly score their conversion propensity.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
