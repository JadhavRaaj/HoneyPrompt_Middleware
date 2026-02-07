import axios from 'axios';

// 1. Point to your Python Backend
const API_URL = 'http://127.0.0.1:8000/api';

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
export const profilesAPI = {
  // GET /api/profiles -> Returns aggregated user stats
  list: () => api.get('/profiles'),
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

// Default export for generic use
export default api;