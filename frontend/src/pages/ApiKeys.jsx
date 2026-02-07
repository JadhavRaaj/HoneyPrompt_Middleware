import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, Check, Shield, X } from 'lucide-react';
import { keysAPI } from '../lib/api';
import './ApiKeys.css';

export default function ApiKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  
  // Form State
  const [newKeyName, setNewKeyName] = useState("");
  const [sourceApp, setSourceApp] = useState("External App");

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await keysAPI.list();
      setKeys(res.data.keys);
    } catch (err) {
      console.error("Failed to load keys");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newKeyName) return;
    // We send source_app now to distinguish between Chatbot and Insta App
    await keysAPI.create({ name: newKeyName, source_app: sourceApp });
    setShowModal(false);
    setNewKeyName("");
    fetchKeys();
  };

  const handleRevoke = async (id) => {
    if (!confirm("Revoke this API key? Apps using it will stop working.")) return;
    await keysAPI.revoke(id);
    fetchKeys();
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="apikeys-page">
      {/* HEADER */}
      <div className="page-header">
        <div className="header-title">
          <Key className="text-yellow" size={28} />
          <h2>API Keys <span className="count-badge">{keys.length}</span></h2>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Generate Key
        </button>
      </div>

      {/* KEYS LIST */}
      <div className="keys-list">
        {loading ? (
          <p className="text-muted">Loading keys...</p>
        ) : keys.length === 0 ? (
          <div className="empty-state">
             <div className="empty-icon"><Key size={40}/></div>
             <p>No API keys generated. Create one to secure your external apps.</p>
          </div>
        ) : keys.map((key) => (
          <div key={key.id} className="key-card">
            <div className="key-icon-area">
              <Shield size={24} className="text-yellow" />
            </div>
            
            <div className="key-info">
              <div className="key-header">
                <h3>{key.name}</h3>
                <span className="status-badge active">Active</span>
                <span className="source-badge">{key.source_app}</span>
              </div>
              <div className="key-value-wrapper">
                <code className="key-value">{key.key_value}</code>
                <button className="copy-btn" onClick={() => copyToClipboard(key.key_value, key.id)}>
                  {copiedId === key.id ? <Check size={14} color="#10b981"/> : <Copy size={14}/>}
                </button>
              </div>
            </div>

            <div className="key-meta">
              <div className="meta-item">
                <span>Created: {new Date(key.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <button className="icon-btn red-hover" onClick={() => handleRevoke(key.id)}>
              <Trash2 size={18}/>
            </button>
          </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Generate New Key</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Key Name (Application)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Insta Clone App" 
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Source App Identifier</label>
                <select 
                  value={sourceApp}
                  onChange={e => setSourceApp(e.target.value)}
                >
                  <option value="External App">External App</option>
                  <option value="Chatbot">Chatbot</option>
                  <option value="InstaApp">InstaApp</option>
                  <option value="SupportBot">SupportBot</option>
                </select>
              </div>
              <div className="info-box">
                <p>⚠️ <strong>Security Warning:</strong> This key grants full access to the HoneyPrompt protection engine. Keep it secret.</p>
              </div>
              <button className="btn-primary full-width" onClick={handleCreate}>Create Secret Key</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}