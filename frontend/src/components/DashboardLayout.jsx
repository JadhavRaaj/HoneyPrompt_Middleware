import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Shield, 
  LayoutDashboard, 
  Activity, 
  Fingerprint, 
  Radar, 
  Webhook, 
  Key, 
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './DashboardLayout.css';

// 1. Accept 'children' as a prop
export default function DashboardLayout({ children }) { 
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="layout-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Shield className="logo-icon" size={28} />
          <span className="logo-text">HoneyPrompt</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <span className="nav-label">MONITORING</span>
            {/* 'end' prop ensures Dashboard only lights up on exact match */}
            <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={20} /> Dashboard
            </NavLink>
            <NavLink to="/attacks" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Activity size={20} /> Attack Logs
            </NavLink>
            <NavLink to="/profiles" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Fingerprint size={20} /> Threat Profiles
            </NavLink>
          </div>

          <div className="nav-section">
            <span className="nav-label">CONFIGURATION</span>
            <NavLink to="/honeypots" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Radar size={20} /> Honeypots
            </NavLink>
            <NavLink to="/webhooks" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Webhook size={20} /> Webhooks
            </NavLink>
            <NavLink to="/apikeys" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Key size={20} /> API Keys
            </NavLink>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">{user?.name?.charAt(0) || 'A'}</div>
            <div className="user-details">
              <span className="user-name">{user?.name || 'Admin'}</span>
              <span className="user-role">Administrator</span>
            </div>
          </div>
          <button onClick={logout} className="logout-btn" title="Sign Out">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        {/* 2. Render 'children' instead of <Outlet /> */}
        {children} 
      </main>
    </div>
  );
}