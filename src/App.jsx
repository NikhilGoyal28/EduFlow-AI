import React, { useState } from 'react';
import { useLeads } from './hooks/useLeads';
import { getThemeStyles } from './constants/theme';
import Header from './components/dashboard/Header';
import KPICards from './components/dashboard/KPICards';
import LeadForm from './components/dashboard/LeadForm';
import WhatsAppParserSandbox from './components/dashboard/WhatsAppParserSandbox';
import ChartsSection from './components/dashboard/ChartsSection';
import LeadTable from './components/dashboard/LeadTable';
import AIInsights from './components/dashboard/AIInsights';
import ReengageModal from './components/ui/ReengageModal';

export default function EduFlowAILeadDashboard() {
  const { leads, filter, setFilter, addLead, addParsedLeads, deleteLead, changeStatus } = useLeads();
  const [darkMode, setDarkMode] = useState(true);
  const [selectedReengageLead, setSelectedReengageLead] = useState(null);
  const theme = getThemeStyles(darkMode);

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.background,
      color: theme.color,
      padding: '24px',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto' }} className="fade-in">
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />
        
        <KPICards leads={leads} darkMode={darkMode} />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', 
            gap: '32px' 
          }}>
            <LeadForm onAddLead={addLead} darkMode={darkMode} />
            <WhatsAppParserSandbox onImportLeads={addParsedLeads} darkMode={darkMode} />
            <AIInsights leads={leads} darkMode={darkMode} onReengage={setSelectedReengageLead} />
          </div>
          
          <ChartsSection leads={leads} darkMode={darkMode} />
          
          <LeadTable 
            leads={leads} 
            filter={filter} 
            setFilter={setFilter}
            onStatusChange={changeStatus}
            onDeleteLead={deleteLead}
            onReengage={setSelectedReengageLead}
            darkMode={darkMode} 
          />
        </div>

        <div style={{
          marginTop: '48px',
          paddingTop: '24px',
          borderTop: `1px solid ${theme.borderColor}`,
          fontSize: '13px',
          color: theme.textColorMuted,
          textAlign: 'center',
          backdropFilter: 'blur(10px)'
        }}>
          <p style={{ margin: '0', fontWeight: '500' }}>
            ✨ Built to solve EduFlow AI's Day-1 problem: Lead management across Facebook, Website & WhatsApp
          </p>
          <p style={{ margin: '8px 0 0 0', opacity: 0.8 }}>
            Enterprise Architecture • Scalable Data Pipeline • Beautiful Modern UI • AI Operational CRM
          </p>
        </div>
      </div>

      {selectedReengageLead && (
        <ReengageModal 
          lead={selectedReengageLead} 
          onClose={() => setSelectedReengageLead(null)} 
          darkMode={darkMode} 
        />
      )}
    </div>
  );
}
