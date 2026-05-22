import React from 'react';
import { sourceColors, getThemeStyles } from '../../constants/theme';

export default function LeadTable({ leads, filter, setFilter, onStatusChange, onDeleteLead, darkMode }) {
  const theme = getThemeStyles(darkMode);
  const filteredLeads = filter === 'All' ? leads : leads.filter(l => l.source === filter);

  return (
    <>
      <div className={theme.glassClass} style={{
        borderRadius: '16px',
        padding: '32px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <h2 style={{ margin: '0', fontSize: '20px', fontWeight: '700' }}>
            Lead Database <span style={{ color: theme.textColorMuted, fontSize: '16px', fontWeight: '500' }}>({filteredLeads.length})</span>
          </h2>
          <div style={{
            display: 'flex',
            gap: '8px',
            background: darkMode ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.6)',
            padding: '4px',
            borderRadius: '12px',
            border: `1px solid ${theme.borderColor}`
          }}>
            {['All', 'Facebook', 'Website', 'WhatsApp'].map(src => (
              <button
                key={src}
                onClick={() => setFilter(src)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: filter === src ? (sourceColors[src] || '#3B82F6') : 'transparent',
                  color: filter === src ? 'white' : theme.textColorMuted,
                  cursor: 'pointer',
                  fontWeight: filter === src ? '600' : '500',
                  fontSize: '13px',
                  transition: 'all 0.2s ease'
                }}
              >
                {src}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {filteredLeads.length > 0 ? (
            <table style={{
              width: '100%',
              borderCollapse: 'separate',
              borderSpacing: '0 8px',
              fontSize: '14px'
            }}>
              <thead>
                <tr>
                  <th style={{ padding: '0 16px 8px 16px', textAlign: 'left', fontWeight: '600', color: theme.textColorMuted }}>Name</th>
                  <th style={{ padding: '0 16px 8px 16px', textAlign: 'left', fontWeight: '600', color: theme.textColorMuted }}>Email</th>
                  <th style={{ padding: '0 16px 8px 16px', textAlign: 'left', fontWeight: '600', color: theme.textColorMuted }}>Source</th>
                  <th style={{ padding: '0 16px 8px 16px', textAlign: 'left', fontWeight: '600', color: theme.textColorMuted }}>Status</th>
                  <th style={{ padding: '0 16px 8px 16px', textAlign: 'left', fontWeight: '600', color: theme.textColorMuted }}>Added</th>
                  <th style={{ padding: '0 16px 8px 16px', textAlign: 'center', fontWeight: '600', color: theme.textColorMuted }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover-lift" style={{ 
                    background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  }}>
                    <td style={{ padding: '16px', borderRadius: '12px 0 0 12px', fontWeight: '500' }}>{lead.name}</td>
                    <td style={{ padding: '16px', color: theme.textColorMuted }}>{lead.email}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        background: `${sourceColors[lead.source]}20`,
                        color: sourceColors[lead.source],
                        fontSize: '12px',
                        fontWeight: '600',
                        border: `1px solid ${sourceColors[lead.source]}40`
                      }}>
                        {lead.source}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <select
                        value={lead.status}
                        onChange={(e) => onStatusChange(lead.id, e.target.value)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${theme.borderColor}`,
                          background: theme.inputBackground,
                          color: theme.color,
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Interested">Interested</option>
                        <option value="Enrolled">Enrolled</option>
                      </select>
                    </td>
                    <td style={{ padding: '16px', color: theme.textColorMuted }}>{lead.addedDate}</td>
                    <td style={{ padding: '16px', textAlign: 'center', borderRadius: '0 12px 12px 0' }}>
                      <button
                        onClick={() => onDeleteLead(lead.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#EF4444',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '600',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => { e.target.style.background = '#EF4444'; e.target.style.color = 'white'; }}
                        onMouseOut={(e) => { e.target.style.background = 'rgba(239, 68, 68, 0.1)'; e.target.style.color = '#EF4444'; }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '48px',
              border: `2px dashed ${theme.borderColor}`,
              borderRadius: '16px'
            }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '24px' }}>📥</p>
              <p style={{ margin: '0', color: theme.textColorMuted, fontWeight: '500' }}>
                Your database is empty. Add a lead to see the magic happen!
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
