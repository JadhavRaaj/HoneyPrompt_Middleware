import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Shield, LayoutDashboard, FileText, Hexagon } from 'lucide-react';
import ChatPage from './ChatPage';
import DashboardPage from './DashboardPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        
        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="brand">
            <Shield className="brand-icon" />
            <div>
              <div style={{fontWeight:'bold', fontSize:'1.1rem'}}>HoneyPrompt</div>
              <div style={{fontSize:'0.7rem', color:'#f59e0b', letterSpacing:'1px'}}>SENTINEL V2.4</div>
            </div>
          </div>

          <nav>
            <NavLink to="/" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} /> Live Sentinel
            </NavLink>
            <NavLink to="/dashboard" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <Hexagon size={18} /> Threat Matrix
            </NavLink>
            <div className="nav-item" style={{opacity:0.5, cursor:'not-allowed'}}>
              <FileText size={18} /> Audit Logs
            </div>
          </nav>

          <div style={{marginTop:'auto', paddingTop:'20px', borderTop:'1px solid #2a2d3d'}}>
             <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <div style={{width:'30px', height:'30px', borderRadius:'50%', background:'#334155'}}></div>
                <div style={{fontSize:'0.85rem'}}>
                  <div>Admin_01</div>
                  <div style={{color:'#10b981', fontSize:'0.7rem'}}>● Online</div>
                </div>
             </div>
          </div>
        </div>

        {/* MAIN AREA */}
        <div className="main-content">
          <div className="top-bar">
            <span>SYS.STATUS: <span style={{color:'#10b981'}}>NOMINAL</span></span>
            <span>UPTIME: 14:02:55</span>
            <span style={{marginLeft:'auto', display:'flex', gap:'15px', alignItems:'center'}}>
               <span style={{color:'#f59e0b'}}>⚡ DEPLOY RULES</span>
            </span>
          </div>

          <div className="page-container">
            <Routes>
              <Route path="/" element={<ChatPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
            </Routes>
          </div>
        </div>

      </div>
    </Router>
  );
}

export default App;