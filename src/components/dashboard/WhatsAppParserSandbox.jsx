import React, { useState } from 'react';
import { parseWhatsAppLogs } from '../../hooks/useLeads';
import { getThemeStyles } from '../../constants/theme';

export default function WhatsAppParserSandbox({ onImportLeads, darkMode }) {
  const theme = getThemeStyles(darkMode);
  const [rawText, setRawText] = useState('');
  const [parsedLeads, setParsedLeads] = useState([]);
  const [hasParsed, setHasParsed] = useState(false);

  const sampleLogs = `[09:30, 15/05/2026] Nikhil Sharma: Hi, interested in BTech CS from Chitkara\n[10:15, 15/05/2026] Priya Singh: When can I get the admission forms?\n[14:45, 16/05/2026] Nikhil Sharma: I confirm my enrollment\n[08:20, 17/05/2026] Arjun Gupta: What's the fee structure?\n[11:00, 17/05/2026] Priya Singh: Confirmed. When is the intake?\n[16:30, 18/05/2026] Arjun Gupta: Still waiting for fee details`;

  const handleParse = () => {
    const parsed = parseWhatsAppLogs(rawText);
    setParsedLeads(parsed);
    setHasParsed(true);
  };

  const handleImport = () => {
    if (parsedLeads.length === 0) return;
    onImportLeads(parsedLeads);
    setRawText('');
    setParsedLeads([]);
    setHasParsed(false);
  };

  const handleLoadSample = () => {
    setRawText(sampleLogs);
  };

  const textareaStyle = {
    padding: '14px',
    border: `1px solid ${theme.borderColor}`,
    borderRadius: '12px',
    background: theme.inputBackground,
    color: theme.color,
    fontSize: '13px',
    fontFamily: 'monospace',
    width: '100%',
    boxSizing: 'border-box',
    minHeight: '120px',
    resize: 'vertical',
    lineHeight: '1.4',
    marginBottom: '16px'
  };

  return (
    <div className={theme.glassClass} style={{
      borderRadius: '16px',
      padding: '32px',
      height: '100%',
      boxSizing: 'border-box'
    }}>
      <h2 style={{ marginTop: '0', marginBottom: '8px', fontSize: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ background: theme.gradientText, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          WhatsApp Log Parser Sandbox
        </span>
        📱
      </h2>
      <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: theme.textColorMuted }}>
        Paste raw WhatsApp exports to extract leads instantly in-browser.
      </p>

      <textarea
        placeholder="Paste exported chat lines here..."
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        style={textareaStyle}
      />

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={handleParse}
          style={{
            background: 'linear-gradient(to right, #10B981, #059669)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 18px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          Parse Chat Logs
        </button>
        <button
          onClick={handleLoadSample}
          style={{
            background: 'transparent',
            color: theme.color,
            border: `1px solid ${theme.borderColor}`,
            borderRadius: '10px',
            padding: '10px 18px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          Load Chat Sample
        </button>
      </div>

      {hasParsed && (
        <div style={{
          borderTop: `1px solid ${theme.borderColor}`,
          paddingTop: '20px',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
            Parsed Extraction Preview ({parsedLeads.length})
          </h4>
          {parsedLeads.length > 0 ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', marginBottom: '16px', paddingRight: '4px' }}>
                {parsedLeads.map((l, idx) => (
                  <div key={idx} style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    border: `1px solid ${theme.borderColor}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <span style={{ fontWeight: '600', fontSize: '13px' }}>{l.name}</span>
                      <span style={{ fontSize: '11px', color: theme.textColorMuted, marginLeft: '8px' }}>
                        💬 {l.messages} msgs
                      </span>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      background: l.status === 'Enrolled' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: l.status === 'Enrolled' ? '#10B981' : '#3B82F6'
                    }}>
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleImport}
                style={{
                  background: theme.gradientText,
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 20px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '14px',
                  width: '100%',
                  boxShadow: '0 4px 12px -3px rgba(139, 92, 246, 0.3)'
                }}
              >
                Import Leads Into Database
              </button>
            </>
          ) : (
            <p style={{ margin: '0', fontSize: '13px', color: '#EF4444' }}>
              ⚠️ No valid leads found. Please make sure messages match exported format: <br/>
              <code style={{ fontSize: '11px', background: 'rgba(239, 68, 68, 0.05)', padding: '2px 4px', borderRadius: '4px' }}>
                [HH:MM, DD/MM/YYYY] Name: Message Text
              </code>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
