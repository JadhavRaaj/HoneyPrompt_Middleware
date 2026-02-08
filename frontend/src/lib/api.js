import axios from 'axios';

// 1. Point to your Python Backend
const API_URL = 'https://honeyprompt-api.onrender.com/api';

// 2. Create the Axios Instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 3. Define the API Services

// --- CHAT (For the User Interface) ---
export const chatAPI = {
  // POST /api/chat -> Sends user message & session_id
  send: (data) => api.post('/chat', data),
};

// --- DASHBOARD (For the Admin Panel) ---
export const dashboardAPI = {
  // GET /api/dashboard/stats -> Returns charts data
  stats: () => api.get('/dashboard/stats'),
};

// --- ALERTS (For the Bell Icon & Recent Activity) ---
export const alertsAPI = {
  // GET /api/alerts -> Returns recent high-risk logs
  list: (params) => api.get('/alerts', { params }),
  // POST /api/alerts/read-all -> Clears notification badge
  markAllRead: () => api.post('/alerts/read-all'),
};

// --- ATTACK LOGS (For the Table) ---
export const attacksAPI = {
  // GET /api/attacks -> Returns full log history
  list: (params) => api.get('/attacks', { params }),
};

// --- THREAT PROFILES (For the Profiles Page) ---
// --- THREAT PROFILES ---
export const profilesAPI = {
  // GET /api/profiles -> Returns aggregated user stats
  list: () => api.get('/profiles'),
  
  // POST /api/profiles/block -> Bans a user
  // Add this new function:
  block: (email) => api.post('/profiles/block', { email }),
};

// --- DECOY ENDPOINTS (For Honeypot Configuration) ---
export const decoysAPI = {
  // GET /api/decoys -> List all fake responses
  list: () => api.get('/decoys'),
  // POST /api/decoys -> Create new decoy
  create: (data) => api.post('/decoys', data),
  // DELETE /api/decoys/:id -> Delete a decoy
  delete: (id) => api.delete(`/decoys/${id}`),
};

// --- WEBHOOKS (For External Integrations) ---
export const webhooksAPI = {
  // GET /api/webhooks -> List all
  list: () => api.get('/webhooks'),
  // POST /api/webhooks -> Register new webhook
  create: (data) => api.post('/webhooks', data),
  // DELETE /api/webhooks/:id -> Remove webhook
  delete: (id) => api.delete(`/webhooks/${id}`),
};

// --- API KEYS (For Developers) ---  <--- THIS WAS MISSING
export const keysAPI = {
  list: () => api.get('/apikeys'),
  create: (data) => api.post('/apikeys', data),
  revoke: (id) => api.delete(`/apikeys/${id}`),
};

// Default export for generic use
export default api;