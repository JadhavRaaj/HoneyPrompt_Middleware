import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import UserChat from './pages/UserChat'; // Import the Chat Page
import AttackLogs from './pages/AttackLogs';
import './App.css';

// Placeholders
const Attacks = () => (
  <div style={{ padding: '20px', color: '#94a3b8' }}>
    <h2>🛑 Attack Logs (Coming Next)</h2>
    <p>We will build this table in the next step.</p>
  </div>
);

const ChatTest = () => (
  <div style={{ padding: '20px', color: '#94a3b8' }}>
    <h2>💬 Chat Test Console (Coming Soon)</h2>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* 1. STANDALONE PAGE (No Sidebar) */}
        <Route path="/chat-interface" element={<UserChat />} />

        {/* 2. ADMIN DASHBOARD (Has Sidebar) */}
        {/* We catch ALL other paths (*) and render the Layout */}
        <Route path="*" element={
          <DashboardLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/attacks" element={<AttackLogs />} />
              <Route path="/chat" element={<ChatTest />} />
              
              {/* Placeholders */}
              <Route path="/profiles" element={<h2>Profiles (Soon)</h2>} />
              <Route path="/users" element={<h2>Users (Soon)</h2>} />
              <Route path="/honeypots" element={<h2>Honeypots (Soon)</h2>} />
              <Route path="/decoys" element={<h2>Decoys (Soon)</h2>} />
              <Route path="/webhooks" element={<h2>Webhooks (Soon)</h2>} />
              <Route path="/apikeys" element={<h2>API Keys (Soon)</h2>} />
            </Routes>
          </DashboardLayout>
        } />
      </Routes>
    </Router>
  );
}

export default App;