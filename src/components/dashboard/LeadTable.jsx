import React, { useState, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import LeadRow from './LeadRow';
import styles from './LeadTable.module.css';
import { sourceColors, getThemeStyles } from '../../constants/theme';

export default function LeadTable({ leads, filter, setFilter, onStatusChange, onDeleteLead, onReengage, darkMode }) {
  const theme = getThemeStyles(darkMode);
  const [sortBy, setSortBy] = useState('score');
  const [sortDirection, setSortDirection] = useState('desc');
  const [search, setSearch] = useState('');

  const handleSort = useCallback((field) => {
    if (sortBy === field) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDirection('desc'); }
  }, [sortBy]);

  const debounce = (fn, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  const setSearchDebounced = useMemo(() => debounce(setSearch, 300), []);

  const filteredLeads = useMemo(() => {
    return leads
      .filter(l => filter === 'All' || l.source === filter)
      .filter(l => !search || l.name?.toLowerCase().includes(search.toLowerCase()) || l.email?.toLowerCase().includes(search.toLowerCase()));
  }, [leads, filter, search]);

  const sortedLeads = useMemo(() => {
    const sorted = [...filteredLeads].sort((a, b) => {
      let aVal = sortBy === 'score' ? (a.ml_score ?? a.score ?? 0) : (a[sortBy] ?? '');
      let bVal = sortBy === 'score' ? (b.ml_score ?? b.score ?? 0) : (b[sortBy] ?? '');
      if (typeof aVal === 'string') return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return sorted;
  }, [filteredLeads, sortBy, sortDirection]);

  const rowHeight = 72; // approx height of a table row
  const itemCount = sortedLeads.length;

  const renderHeader = () => (
    <thead>
      <tr>
        {renderSortHeader('Name', 'name')}
        <th className={styles.th}>Email</th>
        {renderSortHeader('Source', 'source')}
        {renderSortHeader('ML Propensity ↑', 'score', 'center')}
        {renderSortHeader('Status', 'status')}
        {renderSortHeader('Added', 'addedDate')}
        <th className={styles.thCenter}>Actions</th>
      </tr>
    </thead>
  );

  const renderSortHeader = (label, field, alignment = 'left') => {
    const isCurrent = sortBy === field;
    return (
      <th
        className={styles.th}
        style={{ textAlign: alignment, cursor: 'pointer' }}
        onClick={() => handleSort(field)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: alignment === 'center' ? 'center' : 'flex-start' }}>
          {label} {isCurrent ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
        </div>
      </th>
    );
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Source', 'ML Propensity', 'Status', 'Added Date'];
    const rows = sortedLeads.map(l => [l.name, l.email, l.source, `${l.ml_score ?? l.score}%`, l.status, l.addedDate]);
    const csv = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.map(v => `\"${v}\"`).join(','))].join('\n');
    const a = document.createElement('a');
    a.setAttribute('href', encodeURI(csv));
    a.setAttribute('download', `eduflow_leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const exportToJSON = () => {
    const json = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(sortedLeads, null, 2))}`;
    const a = document.createElement('a');
    a.setAttribute('href', json);
    a.setAttribute('download', `eduflow_leads_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <div className={styles.glassClass} style={{ borderRadius: '20px', padding: '32px' }}>
      <div className={styles.headerRow}>
        <div className={styles.controls}>
          <input
            type="text"
            placeholder="🔍  Search leads..."
            defaultValue={search}
            onChange={e => setSearchDebounced(e.target.value)}
            className={styles.searchInput}
          />
          <div className={styles.filterBox}>
            {['All', 'Facebook', 'Website', 'WhatsApp'].map(src => (
              <button
                key={src}
                onClick={() => setFilter(src)}
                className={filter === src ? styles.filterActive : styles.filterBtn}
              >{src}</button>
            ))}
          </div>
          <div className={styles.exportBox}>
            <button onClick={exportToCSV} className={styles.exportBtn}>📥 CSV</button>
            <button onClick={exportToJSON} className={styles.exportBtn}>📋 JSON</button>
          </div>
        </div>
      </div>
      {sortedLeads.length > 0 ? (
        <table className={styles.table} style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px', fontSize: '14px' }}>
          {renderHeader()}
          <tbody>
            <tr>
              <td colSpan={7} style={{ padding: 0 }}>
                <List
                  height={400}
                  itemCount={itemCount}
                  itemSize={rowHeight}
                  width='100%'
                >
                  {({ index, style }) => (
                    <div style={style} key={sortedLeads[index].id}>
                      <LeadRow
                        lead={sortedLeads[index]}
                        onStatusChange={onStatusChange}
                        onDeleteLead={onDeleteLead}
                        onReengage={onReengage}
                        darkMode={darkMode}
                      />
                    </div>
                  )}
                </List>
              </td>
            </tr>
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
  );
}
