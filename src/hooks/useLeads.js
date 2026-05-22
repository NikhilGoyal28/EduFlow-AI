import { useState, useEffect } from 'react';

// ML score now comes directly from the Python backend RandomForest model.
// This function is kept as a thin passthrough; the real score is in lead.ml_score.
export const calculateLeadScore = (lead) => {
  // If the backend already computed an ML score, trust it
  if (lead.ml_score !== undefined && lead.ml_score !== null) return lead.ml_score;
  // Fallback (offline / pre-ML) simple rule
  if (lead.status === 'Enrolled') return 100;
  let score = 45;
  if (lead.source === 'WhatsApp') score += 15;
  else if (lead.source === 'Website') score += 8;
  score += Math.min((lead.messages || 0) * 6, 24);
  if (lead.status === 'Interested') score += 18;
  else if (lead.status === 'New') score -= 12;
  score -= Math.min((lead.days_inactive || 0) * 5, 25);
  return Math.max(0, Math.min(100, score));
};

export const parseWhatsAppLogs = (rawText) => {
  if (!rawText) return [];
  const lines = rawText.split(/\r?\n/);
  const leadsExtracted = {};
  
  // High-fidelity WhatsApp format patterns
  const patterns = [
    // Pattern 1: [09:30, 15/05/2026] Name: Message
    {
      regex: /\[(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?),\s*(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})\]\s*([^:]+):\s*(.+)/i,
      timeIdx: 1, dateIdx: 2, nameIdx: 3, textIdx: 4
    },
    // Pattern 2: [15/05/2026, 09:30:15] Name: Message
    {
      regex: /\[(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\]\s*([^:]+):\s*(.+)/i,
      timeIdx: 2, dateIdx: 1, nameIdx: 3, textIdx: 4
    },
    // Pattern 3: 15/05/2026, 09:30 - Name: Message
    {
      regex: /(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\s*-\s*([^:]+):\s*(.+)/i,
      timeIdx: 2, dateIdx: 1, nameIdx: 3, textIdx: 4
    },
    // Pattern 4: 09:30, 15/05/2026 - Name: Message
    {
      regex: /(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?),\s*(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})\s*-\s*([^:]+):\s*(.+)/i,
      timeIdx: 1, dateIdx: 2, nameIdx: 3, textIdx: 4
    }
  ];

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let matched = false;

    for (const pat of patterns) {
      const match = trimmed.match(pat.regex);
      if (match) {
        const time = match[pat.timeIdx];
        const date = match[pat.dateIdx];
        const name = match[pat.nameIdx].trim();
        const text = match[pat.textIdx].trim();

        // Exclude system notification texts
        if (
          name.toLowerCase().includes('security code') ||
          name.toLowerCase().includes('end-to-end encrypted') ||
          text.toLowerCase().includes('security code') ||
          text.toLowerCase().includes('end-to-end encrypted')
        ) {
          matched = true;
          break;
        }

        if (!leadsExtracted[name]) {
          leadsExtracted[name] = {
            name: name,
            messages: 0,
            converted: false,
            last_contact: `${date} ${time}`,
            status: 'New',
            source: 'WhatsApp',
            email: `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`
          };
        }

        leadsExtracted[name].messages += 1;
        leadsExtracted[name].last_contact = `${date} ${time}`;

        const conversionKeywords = ['interested', 'confirm', 'yes', 'approved', 'enrolled', 'admission', 'intake', 'fees'];
        if (conversionKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
          leadsExtracted[name].converted = true;
          leadsExtracted[name].status = 'Enrolled';
        } else if (leadsExtracted[name].messages > 2) {
          leadsExtracted[name].status = 'Interested';
        }

        matched = true;
        break;
      }
    }

    // Heuristic Fallback
    if (!matched) {
      const parts = trimmed.split(':');
      if (parts.length >= 2) {
        const possibleHeader = parts[0];
        const messageText = parts.slice(1).join(':').trim();
        
        if (possibleHeader.includes(' - ')) {
          const subparts = possibleHeader.split(' - ');
          const name = subparts[1]?.trim();
          if (name && name.length < 50 && messageText.length > 0) {
            const timestamp = subparts[0]?.trim() || '';
            const email = `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`;

            if (!leadsExtracted[name]) {
              leadsExtracted[name] = {
                name: name,
                messages: 1,
                converted: false,
                last_contact: timestamp,
                status: 'New',
                source: 'WhatsApp',
                email: email
              };
            } else {
              leadsExtracted[name].messages += 1;
              leadsExtracted[name].last_contact = timestamp;
            }

            const conversionKeywords = ['interested', 'confirm', 'yes', 'approved', 'enrolled', 'admission', 'intake'];
            if (conversionKeywords.some(keyword => messageText.toLowerCase().includes(keyword))) {
              leadsExtracted[name].converted = true;
              leadsExtracted[name].status = 'Enrolled';
            }
          }
        }
      }
    }
  });

  return Object.values(leadsExtracted);
};

export const useLeads = () => {
  const [leads, setLeads] = useState([]);

  const [filter, setFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // API base URL configuration
  const API_URL = 'http://localhost:5000/api';

  // Load leads from live REST API with real-time polling (10s)
  useEffect(() => {
    let isMounted = true;
    
    const fetchLeads = async () => {
      try {
        const res = await fetch(`${API_URL}/leads`);
        if (!res.ok) throw new Error('API server responded with error status');
        const data = await res.json();
        if (data.status === 'success' && data.leads) {
          const parsedLeads = data.leads.map((lead, idx) => ({
            id: lead.id || Date.now() + idx,
            days_inactive: lead.status === 'New' ? 3 : 0,
            ...lead,
            // ML score comes from backend — use it directly, no local heuristic
            score: lead.ml_score ?? calculateLeadScore(lead),
          }));
          if (isMounted) {
            setLeads(parsedLeads);
            setError(null);
          }
        }
      } catch (err) {
        console.warn('⚠️ REST API is offline. Operating in Resilient Offline Snapshot Mode.', err);
        if (isMounted && !error) setError('API offline. Using local data.');
      }
    };
    
    fetchLeads();
    const intervalId = setInterval(fetchLeads, 10000);
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const recalculateLeads = (currentLeads) => {
    return currentLeads.map(lead => ({
      ...lead,
      score: calculateLeadScore(lead)
    }));
  };

  const addLead = async (leadData) => {
    const newLead = {
      id: Date.now(),
      messages: leadData.messages || 0,
      days_inactive: leadData.status === 'New' ? 3 : 0,
      ...leadData,
      addedDate: leadData.addedDate || new Date().toISOString().split('T')[0]
    };
    newLead.score = calculateLeadScore(newLead);
    
    // Optimistic state updates
    setLeads(prev => [newLead, ...prev]);

    // Live API integration
    try {
      await fetch(`${API_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });
    } catch (err) {
      console.warn('⚠️ Lead saved locally only. API server is offline.', err);
    }
  };

  const addParsedLeads = async (newLeads) => {
    const sanitizedLeads = newLeads.map((l, idx) => {
      const formatted = {
        id: Date.now() + idx,
        days_inactive: l.status === 'New' ? 3 : 0,
        ...l
      };
      formatted.score = calculateLeadScore(formatted);
      return formatted;
    });
    
    setLeads(prevLeads => {
      const existingNames = new Set(prevLeads.map(l => l.name));
      const filteredNew = sanitizedLeads.filter(l => !existingNames.has(l.name));
      return [...filteredNew, ...prevLeads];
    });

    try {
      await fetch(`${API_URL}/leads/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeads)
      });
    } catch (err) {
      console.warn('⚠️ Batch leads imported locally only. API server is offline.', err);
    }
  };

  const deleteLead = async (id) => {
    const leadToDelete = leads.find(l => l.id === id);
    setLeads(prev => prev.filter(lead => lead.id !== id));

    if (leadToDelete) {
      try {
        await fetch(`${API_URL}/leads/${encodeURIComponent(leadToDelete.name)}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.warn('⚠️ Lead deleted locally only. API server is offline.', err);
      }
    }
  };

  const changeStatus = async (id, newStatus) => {
    const leadToUpdate = leads.find(l => l.id === id);
    
    setLeads(prevLeads => 
      recalculateLeads(
        prevLeads.map(lead =>
          lead.id === id ? { ...lead, status: newStatus, days_inactive: newStatus === 'New' ? 3 : 0 } : lead
        )
      )
    );

    if (leadToUpdate) {
      try {
        await fetch(`${API_URL}/leads/${encodeURIComponent(leadToUpdate.name)}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
      } catch (err) {
        console.warn('⚠️ Status updated locally only. API server is offline.', err);
      }
    }
  };

  const filteredLeads = filter === 'All' ? leads : leads.filter(l => l.source === filter);

  return {
    leads,
    filteredLeads,
    filter,
    setFilter,
    addLead,
    addParsedLeads,
    deleteLead,
    changeStatus,
    isLoading,
    error
  };
};
