import { useState, useRef, useEffect } from 'react';
import { Send, ShieldAlert, ShieldCheck, User } from 'lucide-react';
import axios from 'axios';

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: 'Hello! I am your internal AI assistant. I can help you analyze data or summarize reports.',
      isThreat: false
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    if (e.key === 'Enter' && input.trim()) {
      const userMsg = { role: 'user', content: input };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setLoading(true);

      try {
        const res = await axios.post('http://127.0.0.1:8000/api/chat', { message: userMsg.content });
        
        const botMsg = {
          role: 'assistant',
          content: res.data.response,
          isThreat: res.data.metadata.threat_detected,
          metadata: res.data.metadata // Keep metadata for the UI
        };
        setMessages(prev => [...prev, botMsg]);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
  };

  return (
    <div className="chat-feed">
      {messages.map((msg, idx) => (
        <div key={idx} style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
          
          {/* USER MESSAGE */}
          {msg.role === 'user' && (
            <div className="chat-bubble user">
              {msg.content}
            </div>
          )}

          {/* AI MESSAGE (STANDARD) */}
          {msg.role === 'assistant' && !msg.isThreat && (
            <div className="chat-bubble ai">
              <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px', color:'#10b981', fontSize:'0.8rem'}}>
                <ShieldCheck size={16} /> LLM Endpoint [SAFE]
              </div>
              {msg.content}
            </div>
          )}

          {/* THREAT INTERCEPTION UI (MATCHING IMAGE) */}
          {msg.role === 'assistant' && msg.isThreat && (
            <div className="threat-alert">
              <div className="threat-header">
                <span>ATTACK VECTOR DETECTED</span>
                <span>INJECTION: {msg.metadata.categories[0].toUpperCase()}</span>
              </div>
              
              <div className="threat-payload">
                 "Original Prompt Hidden for Safety"
              </div>

              <div className="sentinel-intercept">
                <div className="sentinel-title">
                   <ShieldAlert size={16} /> HoneyPrompt Sentinel [INTERCEPTED]
                </div>
                <div style={{fontSize:'0.9rem', color:'#e0e6ed'}}>
                  &gt; Threat signature match ({msg.metadata.risk_score}%) <br/>
                  &gt; Honeypot trigger: "{msg.metadata.categories[0]}" <br/>
                  &gt; Action: Fake Compliance Response Sent
                </div>
              </div>
              
              {/* The Fake Response the User Sees */}
              <div style={{marginTop:'15px', paddingTop:'10px', borderTop:'1px solid #ef444433', color:'#94a3b8'}}>
                 <strong>Simulated Output:</strong> {msg.content}
              </div>
            </div>
          )}
        </div>
      ))}
      <div ref={scrollRef} />

      {/* INPUT BAR */}
      <div className="input-bar">
        <input 
          type="text" 
          className="input-field"
          placeholder="Type a prompt to test security protocols..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={sendMessage}
          disabled={loading}
        />
      </div>
    </div>
  );
}