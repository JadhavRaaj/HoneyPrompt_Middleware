import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// ------------------------------------------------------------------
// 🔧 CONFIGURATION
// Define the Base URL here so you don't have to change it everywhere.
// ------------------------------------------------------------------
const API_URL = "https://honeyprompt-api.onrender.com/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Load User from Local Storage on Startup
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('hp_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Corrupt user data found, clearing...", error);
      localStorage.removeItem('hp_user');
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Login Function
  const login = async (email, password) => {
    try {
      // POST to /api/login
      const res = await axios.post(`${API_URL}/login`, { email, password });
      
      // Save User Data
      setUser(res.data);
      localStorage.setItem('hp_user', JSON.stringify(res.data));
      
      return { success: true };
    } catch (err) {
      console.error("LOGIN ERROR:", err.response || err); // Debugging log
      return { 
        success: false, 
        message: err.response?.data?.detail || "Login failed. Check server logs." 
      };
    }
  };

  // 3. Register Function
  const register = async (name, email, password, role) => {
    try {
      console.log("Attempting register to:", `${API_URL}/register`);
      
      // POST to /api/register
      await axios.post(`${API_URL}/register`, { 
        name, 
        email, 
        password, 
        role 
      });

      return { success: true };
    } catch (err) {
      console.error("REGISTRATION ERROR:", err.response || err); // Critical Debugging Log
      return { 
        success: false, 
        message: err.response?.data?.detail || "Registration failed. See console for details." 
      };
    }
  };

  // 4. Logout Function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('hp_user');
    // Using window.location ensures a clean state reset
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);