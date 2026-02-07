import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { Shield, AlertTriangle, Activity, Users, Lock } from 'lucide-react';
import { dashboardAPI } from '../lib/api';
import './Dashboard.css';

const COLORS = ['#06b6d4', '#facc15', '#ef4444', '#10b981'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await dashboardAPI.stats();
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) return <div className="p-8 text-white">Loading Security Core...</div>;
  if (!stats) return <div className="p-8 text-white">Dashboard Unavailable</div>;

  return (
    <div className="dashboard-container">
      <h1 className="page-title">Security Overview</h1>

      {/* TOP CARDS */}
      <div className="stats-grid">
        <StatCard 
          title="Total Attacks" 
          value={stats.total_attacks} 
          subtitle="All time"
          icon={<Shield color="#ef4444" />} 
        />
        <StatCard 
          title="High Risk" 
          value={stats.high_risk_attacks} 
          subtitle="Score 80+"
          icon={<AlertTriangle color="#facc15" />} 
        />
        <StatCard 
          title="Active Honeypots" 
          value={stats.active_honeypots} 
          subtitle="Traps Deployed"
          icon={<Activity color="#c084fc" />} 
        />
        <StatCard 
          title="Blocked Users" 
          value={stats.blocked_users} 
          subtitle="Banned IPs"
          icon={<Lock color="#06b6d4" />} 
        />
      </div>

      {/* CHARTS ROW 1 */}
      <div className="charts-row">
        {/* TREND CHART */}
        <div className="chart-card wide">
          <h3>Attack Trend (7 Days)</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <AreaChart data={stats.daily_trend}>
                <defs>
                  <linearGradient id="colorAttacks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickFormatter={(str) => str.slice(5)} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                  itemStyle={{ color: '#06b6d4' }}
                />
                <Area type="monotone" dataKey="attacks" stroke="#06b6d4" fillOpacity={1} fill="url(#colorAttacks)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PIE CHART */}
        <div className="chart-card narrow">
          <h3>Attack Categories</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={stats.category_breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count" /* <--- CRITICAL FIX: Backend sends 'count', not 'value' */
                  nameKey="category"
                >
                  {stats.category_breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Custom Legend */}
            <div className="custom-legend">
              {stats.category_breakdown.map((entry, index) => (
                <div key={index} className="legend-item">
                  <span className="dot" style={{ background: COLORS[index % COLORS.length] }}></span>
                  <span className="label">{entry.category}</span>
                  <span className="val">{entry.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW (Alerts & Risk) */}
      <div className="charts-row">
        <div className="chart-card wide">
          <h3>Recent High Risk Alerts</h3>
          <div className="alerts-list-dashboard">
            {/* We fetch specific alerts or mock top ones if API is separate */}
             <p style={{color:'#64748b', fontSize:'0.9rem', padding:'20px'}}>
               See "Attack Logs" page for detailed breakdown.
             </p>
          </div>
        </div>

        <div className="chart-card narrow">
           <h3>Risk Distribution</h3>
           <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={stats.risk_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="range" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}/>
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40}>
                  {stats.risk_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.range === 'Critical' ? '#ef4444' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
           </div>
        </div>
      </div>

    </div>
  );
}

// Simple Stat Card Component
function StatCard({ title, value, subtitle, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-info">
        <span className="stat-title">{title}</span>
        <span className="stat-value">{value}</span>
        <span className="stat-sub">{subtitle}</span>
      </div>
      <div className="stat-icon-box">{icon}</div>
    </div>
  );
}