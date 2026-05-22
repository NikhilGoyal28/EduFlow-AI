import React, { useState, useEffect } from 'react';
import { getThemeStyles } from '../../constants/theme';

export default function ReengageModal({ lead, onClose, darkMode }) {
  const theme = getThemeStyles(darkMode);
  
  const [phone, setPhone] = useState('91');
  const [selectedTemplate, setSelectedTemplate] = useState('scholarship');
  const [customMessage, setCustomMessage] = useState(null);

  if (!lead) return null;

  const templates = {
    scholarship: {
      name: '🎓 Academic Scholarship Offer',
      body: `Hi ${lead.name},\n\nHope you are doing well! We noticed your interest in the program and wanted to share that a high-value merit-based scholarship has been unlocked for your profile.\n\nCould you please share your latest transcripts to proceed with the application?\n\nBest regards,\nEduFlow AI Admissions Team`
    },
    intake: {
      name: '⚡ Quick Admission Follow-Up',
      body: `Hello ${lead.name},\n\nThis is a quick check-in regarding your admission status. The current intake is closing soon, and seats are filling up rapidly.\n\nAre you available for a brief 5-minute call today to confirm your onboarding details?\n\nBest,\nEduFlow AI Advisor`
    },
    fees: {
      name: '💵 Fee Structure & Payment Plans',
      body: `Hi ${lead.name},\n\nWe noticed you had some queries regarding the program fee structure and scholarship deductions. We have premium installment plans starting this semester.\n\nLet me know if you would like me to send over the PDF prospectus!\n\nWarm regards,\nEduFlow Team`
    }
  };

  const currentMessageText = customMessage !== null ? customMessage : templates[selectedTemplate].body;

  const handleLaunchWhatsApp = () => {
    // Sanitize phone number (digits only)
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const encodedText = encodeURIComponent(currentMessageText);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;
    window.open(waUrl, '_blank');
    onClose();
  };

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.2s ease-out'
  };

  const modalStyle = {
    width: '90%',
    maxWidth: '560px',
    borderRadius: '24px',
    padding: '32px',
    border: `1px solid ${theme.borderColor}`,
    position: 'relative',
    animation: 'fadeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
  };

  const inputStyle = {
    padding: '12px 16px',
    border: `1px solid ${theme.borderColor}`,
    borderRadius: '12px',
    background: theme.inputBackground,
    color: theme.color,
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box',
    marginBottom: '16px',
  };

  const buttonStyle = {
    padding: '12px 24px',
    borderRadius: '12px',
    border: 'none',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '14px',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div 
        className={theme.glassClass} 
        style={modalStyle} 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            background: 'transparent',
            border: 'none',
            color: theme.textColorMuted,
            fontSize: '20px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>

        <h3 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: '850' }}>
          Re-engage Client
        </h3>
        <p style={{ margin: '0 0 24px 0', color: theme.textColorMuted, fontSize: '14px' }}>
          Personalized messaging center for <strong style={{ color: theme.color }}>{lead.name}</strong> ({lead.source})
        </p>

        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: theme.textColorMuted }}>
          Recipient WhatsApp Number (with Country Code)
        </label>
        <input 
          type="text" 
          placeholder="e.g. 919999999999" 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)} 
          style={inputStyle}
        />

        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: theme.textColorMuted }}>
          Select AI Outreach Template
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {Object.entries(templates).map(([key, t]) => (
            <button
              key={key}
              onClick={() => {
                setSelectedTemplate(key);
                setCustomMessage(null);
              }}
              style={{
                textAlign: 'left',
                padding: '12px 16px',
                borderRadius: '12px',
                border: `1px solid ${selectedTemplate === key ? '#3B82F6' : theme.borderColor}`,
                background: selectedTemplate === key ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                color: selectedTemplate === key ? '#3B82F6' : theme.color,
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px',
              }}
            >
              {t.name}
            </button>
          ))}
        </div>

        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: theme.textColorMuted }}>
          Outreach Message Preview
        </label>
        <textarea
          rows={6}
          value={currentMessageText}
          onChange={(e) => setCustomMessage(e.target.value)}
          style={{
            ...inputStyle,
            fontFamily: 'inherit',
            resize: 'none',
            lineHeight: '1.5'
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <button 
            onClick={onClose} 
            style={{
              ...buttonStyle,
              background: 'transparent',
              color: theme.textColorMuted,
              border: `1px solid ${theme.borderColor}`
            }}
          >
            Cancel
          </button>
          <button 
            onClick={handleLaunchWhatsApp}
            style={{
              ...buttonStyle,
              background: 'linear-gradient(to right, #25D366, #128C7E)',
              color: 'white',
              boxShadow: '0 8px 20px -6px rgba(37, 211, 102, 0.4)'
            }}
          >
            🚀 Launch WhatsApp Chat
          </button>
        </div>
      </div>
    </div>
  );
}
