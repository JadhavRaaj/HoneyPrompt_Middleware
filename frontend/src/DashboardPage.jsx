import { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, Activity, Database, Terminal } from 'lucide-react';

export default function DashboardPage() {
  const [logs, setLogs] = useState([]);
  
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:8000/api/logs');
        setLogs(res.data.reverse());
      } catch (err) { console.error("No backend"); }
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, []);

  const criticalCount = logs.filter(l => l.risk_score > 80).length;

  return (
    <div className="dashboard-grid">
      
      {/* LEFT COL: METRICS */}
      <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
        <div className="card">
          <h3 style={{color:'#94a3b8', margin:'0 0 10px 0'}}>THREAT LEVEL</h3>
          <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
            <AlertTriangle size={40} color={criticalCount > 0 ? '#ef4444' : '#10b981'} />
            <div>
              <div className={`stat-value ${criticalCount > 0 ? 'text-red' : 'text-green'}`}>
                {criticalCount > 0 ? 'CRITICAL' : 'NOMINAL'}
              </div>
              <small style={{color:'#64748b'}}>System Integrity: {criticalCount > 0 ? 'Compromised' : '100%'}</small>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{color:'#94a3b8'}}>RECENT INCIDENTS</h3>
          {logs.slice(0, 4).map((log, i) => (
            <div key={i} style={{borderBottom:'1px solid #334155', padding:'10px 0'}}>
               <div style={{display:'flex', justifyContent:'space-between', color:'#f59e0b', fontSize:'0.9rem'}}>
                 <span>{log.threat_categories[0]?.toUpperCase()}</span>
                 <span>RISK: {log.risk_score}</span>
               </div>
               <div style={{fontSize:'0.8rem', color:'#64748b', marginTop:'4px'}}>
                 {new Date(log.timestamp).toLocaleTimeString()}
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT COL: RAW JSON FEED */}
      <div className="card">
        <h3 style={{color:'#94a3b8', display:'flex', alignItems:'center', gap:'10px'}}>
          <Terminal size={18}/> LIVE RAW LOGS
        </h3>
        <div className="json-block" style={{height:'400px', overflowY:'auto'}}>
          {logs.length === 0 ? "Waiting for traffic..." : JSON.stringify(logs[0], null, 2)}
        </div>
      </div>

    </div>
  );
}