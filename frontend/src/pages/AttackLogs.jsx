import React, { useState, useEffect } from 'react';
import { Eye, Search, Download, ShieldAlert, ChevronDown, X, FileText } from 'lucide-react';
import { attacksAPI } from '../lib/api';
import './AttackLogs.css';

export default function AttackLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState(null); 

  useEffect(() => {
    fetchLogs();
    // Auto-refresh logs every 5 seconds
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      // Fetch plenty of logs for the table/export
      const res = await attacksAPI.list({ limit: 100 });
      setLogs(res.data.attacks);
    } catch (err) {
      console.error("Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  };

  // --- EXPORT LOGIC (NEW) ---
  const handleExport = (format) => {
    if (logs.length === 0) return alert("No logs to export!");

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `honeyprompt_logs_${timestamp}.${format}`;
    let content = "";
    let type = "";

    if (format === 'json') {
      // JSON Export
      content = JSON.stringify(logs, null, 2);
      type = "application/json";
    } else {
      // CSV Export
      const headers = ["Timestamp", "Source", "User", "Risk Score", "Message", "Response", "Categories"];
      const rows = logs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.source_app || "Chatbot",
        log.user_email,
        log.risk_score,
        `"${log.message.replace(/"/g, '""')}"`, // Escape quotes
        `"${log.response ? log.response.replace(/"/g, '""') : ''}"`,
        `"${Array.isArray(log.categories) ? log.categories.join(', ') : log.categories}"`
      ]);
      
      content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      type = "text/csv";
    }

    // Trigger Download
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredLogs = logs.filter(log => 
    log.message.toLowerCase().includes(search.toLowerCase()) ||
    log.user_email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="attacks-page">
      {/* --- HEADER --- */}
      <div className="page-header">
        <div className="header-title">
          <ShieldAlert color="#ef4444" size={28} />
          <h2>Attack Logs</h2>
          <span className="count-badge">{logs.length}</span>
        </div>
        
        <div className="header-actions">
          <div className="search-bar">
            <Search size={16} className="search-icon"/>
            <input 
              type="text" 
              placeholder="Search attacks..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          {/* EXPORT BUTTONS (WIRED UP) */}
          <button className="btn-secondary" onClick={() => handleExport('csv')}>
            <FileText size={16}/> CSV
          </button>
          <button className="btn-secondary" onClick={() => handleExport('json')}>
            <Download size={16}/> JSON
          </button>
        </div>
      </div>

      {/* --- TABLE --- */}
      <div className="table-container">
        <table className="logs-table">
          <thead>
            <tr>
              <th style={{width: '180px'}}>TIMESTAMP</th>
              <th style={{width: '220px'}}>USER</th>
              <th>PROMPT PAYLOAD</th>
              <th style={{width: '150px'}}>CATEGORIES</th>
              <th style={{width: '80px'}}>RISK</th>
              <th style={{width: '100px'}}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '40px', color: '#64748b'}}>Scanning for threats...</td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '40px', color: '#64748b'}}>No threats detected.</td></tr>
            ) : filteredLogs.map((log) => (
              <tr key={log.id} className="log-row">
                <td className="timestamp">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="user-email">
                  {log.user_email}
                </td>
                <td>
                  <div className="prompt-text" title={log.message}>
                    {log.message}
                  </div>
                </td>
                <td>
                  <div className="categories-list">
                    {Array.isArray(log.categories) && log.categories.map(cat => (
                      <span key={cat} className={`category-badge ${cat}`}>
                        {cat.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="risk-score">
                    <span className={`risk-dot ${log.risk_score > 80 ? 'critical' : 'high'}`}></span>
                    <span className={log.risk_score > 80 ? 'red' : 'orange'}>
                      {log.risk_score}
                    </span>
                  </div>
                </td>
                <td>
                  <button className="view-btn" onClick={() => setSelectedLog(log)}>
                    <div className="view-btn-icon-circle">
                      <Eye size={14} />
                    </div>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- ATTACK DETAIL MODAL --- */}
      {selectedLog && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', 
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', zIndex: 50, padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px',
            width: '100%', maxWidth: '700px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            display: 'flex', flexDirection: 'column', maxHeight: '90vh'
          }}>
            
            {/* Modal Header */}
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #1e293b'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <ShieldAlert color="#ef4444" size={24} />
                <h3 style={{margin: 0, fontSize: '1.2rem', color: 'white'}}>Attack Detail</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} style={{background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer'}}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px'}}>
              
              {/* Stats Grid */}
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px'}}>
                <div>
                  <label style={{fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px'}}>Risk Score</label>
                  <span style={{fontSize: '2rem', fontFamily: 'monospace', fontWeight: 'bold', color: selectedLog.risk_score > 80 ? '#ef4444' : '#f59e0b'}}>
                    {selectedLog.risk_score}
                  </span>
                </div>
                <div>
                  <label style={{fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px'}}>Timestamp</label>
                  <span style={{fontSize: '0.9rem', color: '#cbd5e1', fontFamily: 'monospace'}}>
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </span>
                </div>
                <div>
                  <label style={{fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px'}}>User</label>
                  <span style={{fontSize: '0.9rem', color: 'white', fontWeight: '500'}}>{selectedLog.user_email}</span>
                </div>
                <div>
                  <label style={{fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px'}}>Session ID</label>
                  <span style={{fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace'}}>{selectedLog.session_id}</span>
                </div>
              </div>

              {/* Categories */}
              <div>
                <label style={{fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px'}}>Categories</label>
                <div style={{display: 'flex', gap: '8px'}}>
                  {Array.isArray(selectedLog.categories) && selectedLog.categories.map(cat => (
                    <span key={cat} className={`category-badge ${cat}`}>
                      {cat.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Prompt */}
              <div>
                <label style={{fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px'}}>Malicious Prompt</label>
                <div style={{backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '12px', color: '#f87171', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.5'}}>
                  {selectedLog.message}
                </div>
              </div>

              {/* Response */}
              <div>
                <label style={{fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px'}}>Honeypot Response</label>
                <div style={{backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px', color: '#22d3ee', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.5'}}>
                  {selectedLog.response || "No response logged."}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}