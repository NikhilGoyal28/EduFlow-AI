import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { sourceColors, getThemeStyles } from '../../constants/theme';

export default function ChartsSection({ leads, darkMode }) {
  const theme = getThemeStyles(darkMode);

  const sourceData = [
    { name: 'Facebook', value: leads.filter(l => l.source === 'Facebook').length },
    { name: 'Website', value: leads.filter(l => l.source === 'Website').length },
    { name: 'WhatsApp', value: leads.filter(l => l.source === 'WhatsApp').length }
  ];

  const statusData = [
    { name: 'New', value: leads.filter(l => l.status === 'New').length },
    { name: 'Contacted', value: leads.filter(l => l.status === 'Contacted').length },
    { name: 'Interested', value: leads.filter(l => l.status === 'Interested').length },
    { name: 'Enrolled', value: leads.filter(l => l.status === 'Enrolled').length }
  ];

  const sourceTimeline = leads.reduce((acc, lead) => {
    const date = lead.addedDate;
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing[lead.source] = (existing[lead.source] || 0) + 1;
    } else {
      acc.push({ date, [lead.source]: 1, Facebook: 0, Website: 0, WhatsApp: 0 });
    }
    return acc;
  }, []).slice(-7);

  const chartCardStyle = {
    borderRadius: '16px',
    padding: '32px',
  };

  const tooltipStyle = {
    background: darkMode ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.9)',
    border: `1px solid ${theme.borderColor}`,
    borderRadius: '12px',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)'
  };

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '32px'
      }}>
        <div className={theme.glassClass} style={chartCardStyle}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: '700' }}>Traffic Sources</h3>
          {sourceData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {sourceData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={sourceColors[entry.name]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textColorMuted }}>
              <p>No data yet</p>
            </div>
          )}
        </div>

        <div className={theme.glassClass} style={chartCardStyle}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: '700' }}>Pipeline Status</h3>
          {statusData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.borderColor} vertical={false} />
                <XAxis dataKey="name" stroke={theme.textColorMuted} axisLine={false} tickLine={false} />
                <YAxis stroke={theme.textColorMuted} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 6, 6]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#color${index})`} />
                  ))}
                </Bar>
                <defs>
                  {statusData.map((entry, index) => (
                    <linearGradient key={`color${index}`} id={`color${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={index === 3 ? '#10B981' : index === 2 ? '#8B5CF6' : '#3B82F6'} />
                      <stop offset="100%" stopColor={index === 3 ? '#059669' : index === 2 ? '#7C3AED' : '#2563EB'} />
                    </linearGradient>
                  ))}
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textColorMuted }}>
              <p>No data yet</p>
            </div>
          )}
        </div>
      </div>

      {sourceTimeline.length > 0 && (
        <div className={theme.glassClass} style={{ ...chartCardStyle }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: '700' }}>7-Day Trajectory</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sourceTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.borderColor} vertical={false} />
              <XAxis dataKey="date" stroke={theme.textColorMuted} axisLine={false} tickLine={false} />
              <YAxis stroke={theme.textColorMuted} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              <Line type="monotone" dataKey="Facebook" stroke={sourceColors['Facebook']} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Website" stroke={sourceColors['Website']} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="WhatsApp" stroke={sourceColors['WhatsApp']} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  );
}
