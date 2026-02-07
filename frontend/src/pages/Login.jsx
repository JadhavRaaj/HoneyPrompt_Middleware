import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, Mail, ArrowRight, LayoutDashboard, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState('user'); // 'admin' or 'user'
  
  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (isRegistering) {
      const res = await register(name, email, password, role);
      if (res.success) {
        setSuccessMsg("Account created! Logging you in...");
        // Auto-login after register
        await performLogin();
      } else {
        setError(res.message);
      }
    } else {
      await performLogin();
    }
  };

  const performLogin = async () => {
    const res = await login(email, password);
    if (res.success) {
      // Navigate based on role OR email contents (for safety)
      if (email.includes("admin") || role === 'admin') navigate('/');
      else navigate('/chat-interface');
    } else {
      setError(res.message);
    }
  };

  // Demo Helpers
  const fillAdmin = () => { setRole('admin'); setEmail("admin@honeyprompt.io"); setPassword("admin123"); };
  const fillUser = () => { setRole('user'); setEmail("user@test.com"); setPassword("user123"); };

  return (
    <div className="login-container">
      <div className={`login-card ${role}`}>
        
        {/* ROLE TOGGLE (Top of Card) */}
        <div className="role-toggle-container">
          <button 
            className={`role-btn ${role === 'admin' ? 'active' : ''}`}
            onClick={() => setRole('admin')}
          >
            <LayoutDashboard size={18} /> Admin Portal
          </button>
          <button 
            className={`role-btn ${role === 'user' ? 'active' : ''}`}
            onClick={() => setRole('user')}
          >
            <MessageSquare size={18} /> User Chat
          </button>
        </div>

        <div className="login-header">
          <Shield size={42} className="logo-icon" />
          <h1>HoneyPrompt</h1>
          <p>{isRegistering ? `Create ${role === 'admin' ? 'Admin' : 'User'} Account` : 'Secure Middleware Access'}</p>
        </div>

        {error && <div className="banner error">{error}</div>}
        {successMsg && <div className="banner success">{successMsg}</div>}

        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <div className="input-group">
              <User size={18} />
              <input 
                type="text" placeholder="Full Name" required
                value={name} onChange={e => setName(e.target.value)}
              />
            </div>
          )}

          <div className="input-group">
            <Mail size={18} />
            <input 
              type="email" placeholder="Email Address" required
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <Lock size={18} />
            <input 
              type="password" placeholder="Password" required
              value={password} onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="submit-btn">
            {isRegistering ? 'Sign Up' : 'Sign In'} <ArrowRight size={18} />
          </button>
        </form>

        <div className="toggle-mode">
          <p>
            {isRegistering ? "Already have an account?" : "Don't have an account?"}
            <button onClick={() => setIsRegistering(!isRegistering)}>
              {isRegistering ? "Sign In" : "Register"}
            </button>
          </p>
        </div>

        {!isRegistering && (
          <div className="demo-section">
            <p>Quick Demo Access:</p>
            <div className="demo-chips">
              <button onClick={fillAdmin} className="chip admin">Admin Demo</button>
              <button onClick={fillUser} className="chip user">User Demo</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}