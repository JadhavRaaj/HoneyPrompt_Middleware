import React, { useState, useEffect } from 'react';
import { Fingerprint, Search, Shield, UserX, Eye } from 'lucide-react';
import { profilesAPI } from '../lib/api';
import './ThreatProfiles.css';

export default function ThreatProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await profilesAPI.list();
        setProfiles(res.data.profiles);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
           <input type="text" placeholder="Search users..." />
        </div>
      </div>

      {/* TABLE */}
      <div className="table-container">
        <table className="profiles-table">
          <thead>
            <tr>
              <th>USER</th>
              <th>THREAT LEVEL</th>
              <th>TOTAL ATTACKS</th>
              <th>AVG RISK</th>
              <th>SESSIONS</th>
              <th>LAST ATTACK</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
               <tr><td colSpan="7" className="text-center">Analyzing user behavior...</td></tr>
            ) : profiles.map((user, i) => (
              <tr key={i} className="profile-row">
                <td>
                  <div className="user-info">
                    <div className="user-name">{user.name}</div>
                    <div className="user-email-sub">{user.email}</div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${user.threat_level.toLowerCase()}`}>
                    {user.threat_level}
                  </span>
                </td>
                <td className="mono-val">{user.total_attacks}</td>
                <td>
                  <span className={`risk-val ${user.avg_risk > 50 ? 'red' : 'green'}`}>
                    {user.avg_risk}
                  </span>
                </td>
                <td className="mono-val">{user.session_count}</td>
                <td className="text-muted">{new Date(user.last_active).toLocaleString()}</td>
                <td>
                  <div className="actions-cell">
                    <button className="icon-btn-text"><Eye size={14}/> Detail</button>
                    <button className="icon-btn-text red-hover"><UserX size={14}/> Block</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}