import React, { useState } from 'react';
import { getThemeStyles } from '../../constants/theme';

export default function LeadForm({ onAddLead, darkMode }) {
  const theme = getThemeStyles(darkMode);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    source: 'Website',
    status: 'New',
    university: 'Chitkara University'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert('Please fill in all fields');
      return;
    }
    onAddLead(formData);
    setFormData({
      name: '',
      email: '',
      source: 'Website',
      status: 'New',
      university: 'Chitkara University'
    });
  };

  const inputStyle = {
    padding: '14px 16px',
    border: `1px solid ${theme.borderColor}`,
    borderRadius: '12px',
    background: theme.inputBackground,
    color: theme.color,
    fontSize: '15px',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(10px)',
  };

  return (
    <div className={theme.glassClass} style={{
      borderRadius: '16px',
      padding: '32px',
    }}>
      <h2 style={{ marginTop: '0', marginBottom: '24px', fontSize: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ background: theme.gradientText, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Capture Lead
        </span>
        ⚡
      </h2>
      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
        }}>
          <input
            type="text"
            placeholder="Student Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={inputStyle}
          />
          <input
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            style={inputStyle}
          />
          <select
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            style={inputStyle}
          >
            <option value="Facebook">🔵 Facebook Ads</option>
            <option value="Website">🌐 Direct Website</option>
            <option value="WhatsApp">💬 WhatsApp Referral</option>
          </select>
          <button
            type="submit"
            className="hover-lift"
            style={{
              background: theme.gradientText,
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '14px 24px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '16px',
              boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.3)'
            }}
          >
            Add Lead Now
          </button>
        </div>
      </form>
    </div>
  );
}
