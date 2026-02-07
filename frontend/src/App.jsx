import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import UserChat from './pages/UserChat'; 
import AttackLogs from './pages/AttackLogs';
import ThreatProfiles from './pages/ThreatProfiles'; 
import Honeypots from './pages/Honeypots'; 
import Webhooks from './pages/Webhooks'; 
import ApiKeys from './pages/ApiKeys'; 
import Login from './pages/Login'; 
import './App.css';

// --- PROTECTED ROUTE COMPONENT ---
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="loading-screen">Loading Security Core...</div>;
  
  // 1. Not logged in -> Go to Login
  if (!user) return <Navigate to="/login" replace />;
  
  // 2. Logged in but wrong role (e.g. User trying to access Admin)
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/chat-interface" replace />;
  }

  return children;
};

// Placeholder Component
const Placeholder = ({ title }) => (
  <div style={{ padding: '30px', color: '#94a3b8' }}>
    <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>{title}</h2>
    <p>This module is under development.</p>
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      {/* 1. PUBLIC ROUTE */}
      <Route path="/login" element={<Login />} />

      {/* 2. USER AREA (Chat Interface) */}
      <Route path="/chat-interface" element={
        <ProtectedRoute>
          <UserChat />
        </ProtectedRoute>
      } />

      {/* 3. ADMIN DASHBOARD (Nested Routes) */}
      {/* ⚠️ CRITICAL FIX: path="/*" allows nested routes to work! */}
      <Route path="/*" element={
        <ProtectedRoute requiredRole="admin">
          <DashboardLayout>
            <Routes>
              {/* These paths are relative to parent (which matches everything) */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/attacks" element={<AttackLogs />} />
              <Route path="/profiles" element={<ThreatProfiles />} /> 
              <Route path="/honeypots" element={<Honeypots />} /> 
              <Route path="/webhooks" element={<Webhooks />} /> 
              <Route path="/apikeys" element={<ApiKeys />} /> 
              
              {/* Placeholders */}
              <Route path="/users" element={<Placeholder title="User Management" />} />
              <Route path="/decoys" element={<Placeholder title="Decoy Data" />} />
              
              {/* Fallback for unknown admin routes -> Dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </DashboardLayout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}