import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import UserChat from './pages/UserChat'; 
import AttackLogs from './pages/AttackLogs';
import ThreatProfiles from './pages/ThreatProfiles'; 
import Honeypots from './pages/Honeypots';// <--- NEW IMPORT
import './App.css';

// Placeholders for remaining pages
const Placeholder = ({ title }) => (
  <div style={{ padding: '30px', color: '#94a3b8' }}>
    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '10px' }}>{title}</h2>
    <p>This component is coming soon.</p>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* 1. STANDALONE PAGE (Chat Interface - No Sidebar) */}
        <Route path="/chat-interface" element={<UserChat />} />

        {/* 2. ADMIN DASHBOARD (Wrapped in Layout) */}
        {/* Catches all other paths and applies the sidebar layout */}
        <Route path="*" element={
          <DashboardLayout>
            <Routes>
              {/* Main Dashboard */}
              <Route path="/" element={<Dashboard />} />
              
              {/* Features we have built */}
              <Route path="/attacks" element={<AttackLogs />} />
              <Route path="/profiles" element={<ThreatProfiles />} /> 
              <Route path="/honeypots" element={<Honeypots />} />

              {/* Placeholders for future steps */}
              <Route path="/chat" element={<Placeholder title="Chat Test Console" />} />
              <Route path="/users" element={<Placeholder title="User Management" />} />
              <Route path="/honeypots" element={<Placeholder title="Honeypot Configuration" />} />
              <Route path="/decoys" element={<Placeholder title="Decoy Data" />} />
              <Route path="/webhooks" element={<Placeholder title="Webhooks" />} />
              <Route path="/apikeys" element={<Placeholder title="API Keys" />} />
              
              {/* Fallback: redirect unknown admin routes to Dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </DashboardLayout>
        } />
      </Routes>
    </Router>
  );
}

export default App;