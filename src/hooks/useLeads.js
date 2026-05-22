import { useState } from 'react';
import initialReport from '../../lead_report.json';

export const useLeads = () => {
  const [leads, setLeads] = useState(() => {
    return (initialReport.leads || []).map((lead, idx) => ({
      id: lead.id || Date.now() + idx,
      ...lead
    }));
  });
  const [filter, setFilter] = useState('All');

  const addLead = (leadData) => {
    const newLead = {
      id: Date.now(),
      ...leadData,
      addedDate: new Date().toISOString().split('T')[0]
    };
    setLeads([newLead, ...leads]);
  };

  const deleteLead = (id) => {
    setLeads(leads.filter(lead => lead.id !== id));
  };

  const changeStatus = (id, newStatus) => {
    setLeads(leads.map(lead =>
      lead.id === id ? { ...lead, status: newStatus } : lead
    ));
  };

  const filteredLeads = filter === 'All' ? leads : leads.filter(l => l.source === filter);

  return {
    leads,
    filteredLeads,
    filter,
    setFilter,
    addLead,
    deleteLead,
    changeStatus
  };
};
