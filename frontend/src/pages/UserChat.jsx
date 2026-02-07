import React, { useState, useRef, useEffect } from 'react';
import { Send, Shield, User, Bot, Plus, ArrowRight, LogOut } from 'lucide-react';
import { chatAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext'; // <--- IMPORT AUTH
import './UserChat.css';

const SUGGESTIONS = [
  { label: "What are the latest cybersecurity threats?", prompt: "What are the latest cybersecurity threats?" },
  { label: "Explain prompt injection attacks", prompt: "Explain prompt injection attacks in simple terms." },
  { label: "How do honeypot systems work?", prompt: "How do honeypot systems work?" },
  { label: "Best practices for API security", prompt: "What are the best practices for API security?" }
];

export default function UserChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  
  // Get User Info from Auth Context
  const { user, logout } = useAuth();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text = input) => {
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Send the logged-in user's email to the backend
      const res = await chatAPI.send({
        message: text,
        session_id: "user-session-1",
        user_email: user?.email // <--- CRITICAL FOR BLOCKING LOGIC
      });

      const botMsg = { role: 'bot', content: res.data.response };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'bot', content: "Error: Unable to connect to the secure server." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setInput("");
  };

  // Helper to get initials (e.g. "admin@test.com" -> "AD")
  const getInitials = () => {
    if (!user || !user.email) return "U";
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="chat-interface">
      {/* HEADER */}
      <header className="chat-header">
        <div className="logo-area">
          <Shield className="logo-icon-sm" size={20} />
          <span className="logo-text">HoneyPrompt</span>
        </div>
        <div className="header-controls">
          <button className="new-chat-btn" onClick={startNewChat}>
            <Plus size={16} /> New Chat
          </button>
          
          <div className="user-profile-area" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <div className="user-avatar-sm" title={user?.email}>
               {getInitials()}
             </div>
             {/* Logout Button */}
             <button 
               onClick={logout} 
               className="logout-btn"
               style={{ 
                 background: 'none', border: 'none', color: '#64748b', 
                 cursor: 'pointer', display: 'flex', alignItems: 'center' 
               }}
               title="Sign Out"
             >
               <LogOut size={18} />
             </button>
          </div>
        </div>
      </header>

      {/* MAIN CHAT AREA */}
      <main className="chat-container">
        <div className="chat-column">

          {messages.length === 0 ? (
            /* WELCOME SCREEN */
            <div className="welcome-screen">
              <div className="logo-hero">
                <Shield size={40} />
              </div>
              <h1>Hello, {user?.name || 'User'}</h1>
              <p className="subtitle">
                I'm your secure AI assistant. Protected by HoneyPrompt Middleware.
              </p>

              <div className="suggestions-grid">
                {SUGGESTIONS.map((card, i) => (
                  <button
                    key={i}
                    className="suggestion-card"
                    onClick={() => handleSend(card.prompt)}
                  >
                    <span>{card.label}</span>
                    <ArrowRight size={16} className="arrow-icon" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* MESSAGE STREAM */
            <div className="messages-list">
              {messages.map((msg, i) => (
                <div key={i} className={`message-row ${msg.role}`}>
                  <div className="avatar">
                    {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                  </div>
                  <div className="message-content">
                    <div className="sender-name">
                      {msg.role === 'user' ? (user?.name || 'You') : 'HoneyPrompt AI'}
                    </div>
                    {/* Check if message contains "ACCESS DENIED" to style it red */}
                    <div className={`text-bubble ${msg.content.includes("ACCESS DENIED") || msg.content.includes("BLOCKED") ? 'risk-critical' : ''}`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="message-row bot">
                  <div className="avatar"><Bot size={18} /></div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={scrollRef} />
            </div>
          )}

        </div>
      </main>

      {/* FOOTER */}
      <footer className="chat-footer">
        <div className="input-wrapper">
          <input
            type="text"
            placeholder="Message HoneyPrompt..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            className={`send-btn ${input.trim() ? 'active' : ''}`}
            onClick={() => handleSend()}
            disabled={!input.trim()}
          >
            <Send size={18} />
          </button>
        </div>
        <p className="footer-note">
          HoneyPrompt AI can make mistakes. Verify important information.
        </p>
      </footer>
    </div>
  );
}