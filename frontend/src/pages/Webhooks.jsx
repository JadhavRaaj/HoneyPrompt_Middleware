import React, { useState, useEffect } from 'react';
import { Webhook, Plus, Trash2, Globe, ShieldAlert, X } from 'lucide-react';
import { webhooksAPI } from '../lib/api';
import './Webhooks.css';

export default function Webhooks() {
  const [hooks, setHooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [newHook, setNewHook] = useState({ name: "", url: "", min_risk_score: 70 });

  useEffect(() => {
    fetchHooks();
  }, []);

  const fetchHooks = async () => {
    try {
      const res = await webhooksAPI.list();
      setHooks(res.data.webhooks);
    } catch (err) {
      console.error("Failed to load webhooks");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this integration?")) return;
    await webhooksAPI.delete(id);
    fetchHooks();
  };

  const handleCreate = async () => {
    if (!newHook.name || !newHook.url) return;
    await webhooksAPI.create(newHook);
    setShowModal(false);
    setNewHook({ name: "", url: "", min_risk_score: 70 });
    fetchHooks();
  };

  return (
    <div className="webhooks-page">
      {/* HEADER */}
      <div className="page-header">
        <div className="header-title">
          <Webhook className="text-cyan" size={28} />
          <h2>Webhook Alerts <span className="count-badge">{hooks.length}</span></h2>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> New Webhook
        </button>
      </div>

      {/* LIST */}
      <div className="hooks-list">
        {loading ? (
          <p className="text-muted">Loading integrations...</p>
        ) : hooks.length === 0 ? (
          <div className="empty-state">
             <div className="empty-icon"><Webhook size={40}/></div>
             <p>No webhooks configured. Create one to receive attack alerts via HTTP POST.</p>
          </div>
        ) : hooks.map((hook) => (
          <div key={hook.id} className="hook-card">
            <div className="hook-icon-area">
              <Globe size={24} className="text-cyan" />
            </div>
            
            <div className="hook-info">
              <div className="hook-header">
                <h3>{hook.name}</h3>
                <span className="status-badge active">Active</span>
              </div>
              <div className="hook-url">{hook.url}</div>
            </div>

            <div className="hook-meta">
              <div className="meta-item">
                <ShieldAlert size={14} />
                <span>Min Risk: {hook.min_risk_score}</span>
              </div>
            </div>

            <div className="hook-actions">
              <button className="icon-btn red-hover" onClick={() => handleDelete(hook.id)}>
                <Trash2 size={18}/>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Webhook</h3>
              <button onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Integration Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Slack Security Channel" 
                  value={newHook.name}
                  onChange={e => setNewHook({...newHook, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Endpoint URL</label>
                <input 
                  type="text" 
                  placeholder="https://hooks.slack.com/services/..." 
                  value={newHook.url}
                  onChange={e => setNewHook({...newHook, url: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Minimum Risk Score to Trigger</label>
                <div className="range-wrapper">
                  <input 
                    type="range" min="0" max="100" step="10"
                    value={newHook.min_risk_score}
                    onChange={e => setNewHook({...newHook, min_risk_score: parseInt(e.target.value)})}
                  />
                  <span className="range-val">{newHook.min_risk_score}</span>
                </div>
              </div>
              <button className="btn-primary full-width" onClick={handleCreate}>Connect Webhook</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}