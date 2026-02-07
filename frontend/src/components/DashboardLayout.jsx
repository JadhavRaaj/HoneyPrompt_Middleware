import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  ShieldAlert, Activity, Terminal, Users, Radar, Bell, 
  Fingerprint, Webhook, Key, Database, ChevronLeft
} from 'lucide-react';
import '../App.css'; // Ensure CSS is imported

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: Activity },
  { path: '/attacks', label: 'Attack Logs', icon: ShieldAlert },
  { path: '/profiles', label: 'Threat Profiles', icon: Fingerprint },
  { path: '/chat', label: 'Chat Test', icon: Terminal },
  { path: '/users', label: 'Users', icon: Users },
  { path: '/honeypots', label: 'Honeypots', icon: Radar },
  { path: '/decoys', label: 'Decoy Data', icon: Database }, // Added from your uploaded files
  { path: '/webhooks', label: 'Webhooks', icon: Webhook },
  { path: '/apikeys', label: 'API Keys', icon: Key },
];

export default function DashboardLayout({ children }) {
  const location = useLocation();
  const currentTitle = NAV_ITEMS.find(n => n.path === location.pathname)?.label || 'Dashboard';

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand-header">
          <div className="logo-icon">
            <ShieldAlert size={20} />
          </div>
          <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>HoneyPrompt</span>
        </div>

        <nav className="nav-menu">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <div className="main-area">
        <header className="top-header">
          <div className="page-title">{currentTitle}</div>
          
          <div className="header-actions">
            <button className="icon-btn">
              <Bell size={18} />
            </button>
            
            <div className="user-badge">
              <div className="avatar-initial">A</div>
              <span>abhin shetty</span>
            </div>
          </div>
        </header>

        <main className="content-scroll">
          {children}
        </main>
      </div>
    </div>
  );
}