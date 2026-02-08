import React, { useState, useEffect } from 'react';
import { Fingerprint, Search, Shield, UserX, Eye, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { profilesAPI } from '../lib/api';
import './ThreatProfiles.css';

export default function ThreatProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null); // For the Modal
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const res = await profilesAPI.list();
      setProfiles(res.data.profiles);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async (email) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY BLOCK ${email}?`)) return;

    try {
      await profilesAPI.block(email);
      // Optimistic UI Update: Find the user and change status to 'Blocked'
      setProfiles(prev => prev.map(p => 
        p.email === email ? { ...p, status: 'Blocked' } : p
      ));
      
      // If the modal is open for this user, update it too
      if (selectedUser && selectedUser.email === email) {
        setSelectedUser(prev => ({ ...prev, status: 'Blocked' }));
      }
    } catch (err) {
      alert("Failed to block user.");
    }
  };

  // Filter users based on search
  const filteredProfiles = profiles.filter(p => 
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="profiles-page">
      {/* HEADER */}
      <div className="page-header">
        <div className="header-title">
          <Fingerprint className="text-cyan" size={28} />
          <h2>Threat Profiles <span className="count-badge">{profiles.length}</span></h2>
        </div>
        <div className="search-bar">
           <Search size={16} className="search-icon"/>
           <input 
             type="text" 
             placeholder="Search users..." 
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      {/* TABLE */}
      <div className="table-container">
        <table className="profiles-table">
          <thead>
            <tr>
              <th>USER</th>
              <th>THREAT LEVEL</th>
              <th>STATUS</th>
              <th>TOTAL ATTACKS</th>
              <th>AVG RISK</th>
              <th>LAST ATTACK</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
               <tr><td colSpan="7" style={{textAlign: 'center', padding: '30px'}}>Analyzing user behavior...</td></tr>
            ) : filteredProfiles.length === 0 ? (
               <tr><td colSpan="7" style={{textAlign: 'center', padding: '30px'}}>No profiles found.</td></tr>
            ) : filteredProfiles.map((user, i) => (
              <tr key={i} className={`profile-row ${user.status === 'Blocked' ? 'blocked-row' : ''}`}>
                <td>
                  <div className="user-info">
                    <div className="user-name">{user.name}</div>
                    <div className="user-email-sub">{user.email}</div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${user.threat_level?.toLowerCase() || 'low'}`}>
                    {user.threat_level}
                  </span>
                </td>
                <td>
                  {user.status === 'Blocked' ? (
                    <span className="status-badge blocked"><UserX size={12}/> Blocked</span>
                  ) : (
                    <span className="status-badge active"><CheckCircle size={12}/> Active</span>
                  )}
                </td>
                <td className="mono-val">{user.total_attacks}</td>
                <td>
                  <span className={`risk-val ${user.avg_risk > 50 ? 'red' : 'green'}`}>
                    {Math.round(user.avg_risk)}
                  </span>
                </td>
                <td className="text-muted">
                  {user.last_active ? new Date(user.last_active).toLocaleDateString() : 'N/A'}
                </td>
                <td>
                  <div className="actions-cell">
                    <button className="icon-btn-text" onClick={() => setSelectedUser(user)}>
                      <Eye size={14}/> Detail
                    </button>
                    {user.status !== 'Blocked' && (
                      <button className="icon-btn-text red-hover" onClick={() => handleBlock(user.email)}>
                        <UserX size={14}/> Block
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- DETAIL MODAL --- */}
      {selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <Shield className="text-cyan" size={20}/> 
                Threat Profile: {selectedUser.name}
              </h3>
              <button onClick={() => setSelectedUser(null)} className="close-btn"><X size={20}/></button>
            </div>
            
            <div className="modal-body">
              {/* Top Card: User Identity */}
              <div className="user-identity-card">
                <div className="avatar-large">{selectedUser.name.charAt(0).toUpperCase()}</div>
                <div>
                  <h4>{selectedUser.email}</h4>
                  <div className="badges-row">
                    <span className={`badge ${selectedUser.threat_level.toLowerCase()}`}>{selectedUser.threat_level} Risk</span>
                    {selectedUser.status === 'Blocked' && <span className="badge critical">BLOCKED</span>}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="stats-grid-modal">
                <div className="stat-box">
                  <label>Total Attacks</label>
                  <span>{selectedUser.total_attacks}</span>
                </div>
                <div className="stat-box">
                  <label>Avg Risk Score</label>
                  <span className={selectedUser.avg_risk > 50 ? 'red' : 'green'}>{Math.round(selectedUser.avg_risk)}</span>
                </div>
                <div className="stat-box">
                  <label>Unique Sessions</label>
                  <span>{selectedUser.session_count}</span>
                </div>
                <div className="stat-box">
                  <label>Last Active</label>
                  <span style={{fontSize: '0.8rem'}}>{new Date(selectedUser.last_active).toLocaleString()}</span>
                </div>
              </div>

              {/* Warning Box */}
              {selectedUser.avg_risk > 80 && (
                <div className="warning-box">
                  <AlertTriangle size={18} />
                  <p>This user has repeatedly attempted high-severity attacks (Injection/Jailbreak). Recommended action: <strong>BLOCK</strong>.</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedUser(null)}>Close</button>
              {selectedUser.status !== 'Blocked' && (
                <button className="btn-danger" onClick={() => handleBlock(selectedUser.email)}>
                  <UserX size={16}/> Block User Access
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}