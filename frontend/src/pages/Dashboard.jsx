import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Activity, Radar, Bell, AlertTriangle, UserX, Lock 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { dashboardAPI, alertsAPI } from '../lib/api';
import './Dashboard.css';

const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, alertsRes] = await Promise.all([
          dashboardAPI.stats(),
          alertsAPI.list({ limit: 5 })
        ]);
        setStats(statsRes.data);
        setAlerts(alertsRes.data.alerts);
      } catch (err) {
        console.error("Failed to load dashboard", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="loading-screen">Loading Command Center...</div>;

  return (
    <div className="dashboard-page">
      
      {/* 1. STATS ROW */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">TOTAL ATTACKS</span>
            <span className="stat-value red">{stats.total_attacks}</span>
            <span className="stat-sub">All time</span>
          </div>
          <div className="stat-icon red-bg"><ShieldAlert /></div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">HIGH RISK</span>
            <span className="stat-value orange">{stats.high_risk_attacks}</span>
            <span className="stat-sub">Score 70+</span>
          </div>
          <div className="stat-icon orange-bg"><AlertTriangle /></div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">ACTIVE HONEYPOTS</span>
            <span className="stat-value purple">{stats.active_honeypots}</span>
            <span className="stat-sub">Traps Deployed</span>
          </div>
          <div className="stat-icon purple-bg"><Radar /></div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">BLOCKED USERS</span>
            <span className="stat-value blue">{stats.blocked_users}</span>
            <span className="stat-sub">Banned IPs</span>
          </div>
          <div className="stat-icon blue-bg"><UserX /></div>
        </div>
      </div>

      {/* 2. CHARTS ROW */}
      <div className="charts-grid">
        {/* Area Chart */}
        <div className="chart-card">
          <h3 className="card-title"><Activity size={16}/> ATTACK TREND (7 DAYS)</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.daily_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickFormatter={d => d.slice(5)} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{backgroundColor: '#020617', borderColor: '#1e293b'}} />
                <Area type="monotone" dataKey="attacks" stroke="var(--primary)" fill="rgba(6, 182, 212, 0.1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="chart-card">
          <h3 className="card-title"><Lock size={16}/> ATTACK CATEGORIES</h3>
          <div className="chart-wrapper flex-row">
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie data={stats.category_breakdown} dataKey="count" innerRadius={40} outerRadius={70}>
                  {stats.category_breakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="legend">
              {stats.category_breakdown.map((item, i) => (
                <div key={i} className="legend-item">
                  <span className="dot" style={{background: COLORS[i % COLORS.length]}}></span>
                  <span>{item.category.replace('_', ' ')}</span>
                  <span className="bold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. ALERTS ROW */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3 className="card-title"><Bell size={16}/> RECENT ALERTS</h3>
          <div className="alerts-list">
            {alerts.length === 0 ? <p className="no-data">No active threats.</p> : 
             alerts.map(alert => (
               <div key={alert.id} className="alert-item">
                 <div className="alert-dot"></div>
                 <div className="alert-content">
                   <p className="alert-msg">"{alert.message_preview}"</p>
                   <div className="alert-meta">
                     <span className="risk-badge">Risk: {alert.risk_score}</span>
                     <span className="alert-user">{alert.user_email}</span>
                   </div>
                 </div>
               </div>
             ))}
          </div>
        </div>
        
        {/* Risk Bar Chart */}
        <div className="chart-card">
          <h3 className="card-title"><AlertTriangle size={16}/> RISK DISTRIBUTION</h3>
          <div className="chart-wrapper">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.risk_distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="range" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#020617'}} />
                  <Bar dataKey="count" fill="#10b981" barSize={40} radius={[4, 4, 0, 0]} />
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}