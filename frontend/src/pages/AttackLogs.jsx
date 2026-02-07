import React, { useState, useEffect } from 'react';
import { Eye, Search, Download, ShieldAlert, ChevronDown, X } from 'lucide-react';
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
      const res = await attacksAPI.list({ limit: 50 });
      setLogs(res.data.attacks);
    } catch (err) {
      console.error("Failed to fetch logs");
    } finally {
      setLoading(false);
    }
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
          <button className="btn-secondary">
            All Categories <ChevronDown size={14} style={{marginLeft: 6}}/>
          </button>
          <button className="btn-secondary"><Download size={16}/> CSV</button>
          <button className="btn-secondary"><Download size={16}/> JSON</button>
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
                    {log.categories.map(cat => (
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

      {/* --- ATTACK DETAIL MODAL (Screenshot UI 3) --- */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-[#1e293b]">
              <div className="flex items-center gap-3">
                <ShieldAlert className="text-red-500" size={24} />
                <h3 className="text-lg font-bold text-white">Attack Detail</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Risk Score</label>
                  <span className={`text-3xl font-mono font-bold ${selectedLog.risk_score > 80 ? 'text-red-500' : 'text-orange-500'}`}>
                    {selectedLog.risk_score}
                  </span>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Timestamp</label>
                  <span className="text-sm text-gray-300 font-mono">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </span>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">User</label>
                  <span className="text-sm text-white font-medium">{selectedLog.user_email}</span>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Session ID</label>
                  <span className="text-xs text-gray-400 font-mono">{selectedLog.session_id}</span>
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Categories</label>
                <div className="flex gap-2">
                  {selectedLog.categories.map(cat => (
                    <span key={cat} className={`category-badge ${cat}`}>
                      {cat.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Prompt */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Malicious Prompt</label>
                <div className="bg-black/30 border border-red-500/20 rounded-lg p-3 text-red-400 font-mono text-sm leading-relaxed">
                  {selectedLog.message}
                </div>
              </div>

              {/* Response */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Honeypot Response</label>
                <div className="bg-black/30 border border-[#1e293b] rounded-lg p-3 text-cyan-400 font-mono text-sm leading-relaxed">
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