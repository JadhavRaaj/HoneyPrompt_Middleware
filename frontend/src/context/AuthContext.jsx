import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const login = async (email, password) => {
    try {
      const res = await axios.post('http://localhost:8000/api/login', { email, password });
      setUser(res.data);
      localStorage.setItem('hp_user', JSON.stringify(res.data));
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.detail || "Login failed" 
      };
    }
  };

  const register = async (name, email, password, role) => {
    try {
      await axios.post('http://localhost:8000/api/register', { 
        name, email, password, role 
      });
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.detail || "Registration failed" 
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hp_user');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);