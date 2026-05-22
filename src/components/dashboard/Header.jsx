import React from 'react';
import { getThemeStyles } from '../../constants/theme';

export default function Header({ darkMode, setDarkMode }) {
  const theme = getThemeStyles(darkMode);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '32px',
      padding: '24px',
      borderRadius: '16px',
      borderBottom: `1px solid ${theme.borderColor}`
    }} className={theme.glassClass}>
      <div>
        <h1 style={{
          margin: '0 0 8px 0',
          fontSize: '32px',
          fontWeight: '800',
          background: theme.gradientText,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.5px'
        }}>
          EduFlow AI Command Center
        </h1>
        <p style={{ margin: '0', fontSize: '15px', color: theme.textColorMuted, fontWeight: '500' }}>
          Real-time Lead Management & Conversion Analytics
        </p>
      </div>
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="hover-lift"
        style={{
          background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          color: theme.color,
          border: `1px solid ${theme.borderColor}`,
          padding: '12px 20px',
          borderRadius: '12px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </button>
    </div>
  );
}
