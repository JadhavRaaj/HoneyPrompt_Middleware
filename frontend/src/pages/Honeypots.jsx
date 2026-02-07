import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Radar, X } from 'lucide-react';
import { decoysAPI } from '../lib/api';
import './Honeypots.css';

export default function Honeypots() {
  const [decoys, setDecoys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [newDecoy, setNewDecoy] = useState({ 
    title: "", 
    category: "social_engineering", 
    triggers: "", // <--- Added field
    content: "" 
  });

  useEffect(() => {
    fetchDecoys();
  }, []);

  const fetchDecoys = async () => {
    try {
      const res = await decoysAPI.list();
      setDecoys(res.data.decoys);
    } catch (err) {
      console.error("Failed to load honeypots");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this honeypot trap?")) return;
    await decoysAPI.delete(id);
    fetchDecoys();
  };

  const handleCreate = async () => {
    if (!newDecoy.title || !newDecoy.content || !newDecoy.triggers) return;
    await decoysAPI.create(newDecoy);
    setShowModal(false);
    setNewDecoy({ title: "", category: "social_engineering", triggers: "", content: "" }); // Reset
    fetchDecoys();
  };

  return (
    <div className="honeypots-page">
      {/* HEADER */}
      <div className="page-header">
        <div className="header-title">
          <Radar className="text-purple" size={28} />
          <h2>Honeypot Configuration <span className="count-badge">{decoys.length}</span></h2>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> New Honeypot
        </button>
      </div>

      {/* CARDS GRID */}
      <div className="honeypots-list">
        {loading ? (
          <p className="text-muted">Loading traps...</p>
        ) : decoys.length === 0 ? (
          <div className="empty-state">
             <p>No honeypots configured. Create one to catch attackers!</p>
          </div>
        ) : decoys.map((decoy) => (
          <div key={decoy.id} className="honeypot-card">
            <div className="card-content">
              <div className="card-header">
                <h3 className="card-title">{decoy.title}</h3>
                <span className={`category-badge ${decoy.category}`}>
                  {decoy.category.replace('_', ' ')}
                </span>
                <span className="status-badge active">Active</span>
              </div>
              
              {/* Show triggers in UI */}
              <div className="triggers-list">
                <span className="trigger-label">Triggers:</span> 
                <span className="trigger-val">{decoy.triggers}</span>
              </div>

              <p className="card-desc">{decoy.content}</p>
            </div>
            
            <div className="card-actions">
              <label className="switch">
                <input type="checkbox" defaultChecked={decoy.is_active} />
                <span className="slider round"></span>
              </label>
              <button className="icon-btn"><Edit2 size={16}/></button>
              <button className="icon-btn red-hover" onClick={() => handleDelete(decoy.id)}>
                <Trash2 size={16}/>
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
              <h3>Create New Trap</h3>
              <button onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Trap Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Fake Admin Login" 
                  value={newDecoy.title}
                  onChange={e => setNewDecoy({...newDecoy, title: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select 
                  value={newDecoy.category}
                  onChange={e => setNewDecoy({...newDecoy, category: e.target.value})}
                >
                  <option value="social_engineering">Social Engineering</option>
                  <option value="prompt_leakage">Prompt Leakage</option>
                  <option value="data_exfiltration">Data Exfiltration</option>
                  <option value="instruction_override">Instruction Override</option>
                </select>
              </div>

              {/* NEW TRIGGER INPUT */}
              <div className="form-group">
                <label>Trigger Keywords (comma separated)</label>
                <input 
                  type="text" 
                  placeholder="e.g. admin, password, secret, login" 
                  value={newDecoy.triggers} 
                  onChange={e => setNewDecoy({...newDecoy, triggers: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Fake Content (The Bait)</label>
                <textarea 
                  rows="3" 
                  placeholder="e.g. Access Granted. Password is 'admin123'."
                  value={newDecoy.content}
                  onChange={e => setNewDecoy({...newDecoy, content: e.target.value})}
                ></textarea>
              </div>
              <button className="btn-primary full-width" onClick={handleCreate}>Deploy Trap</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}