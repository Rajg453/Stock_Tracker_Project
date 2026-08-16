import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create a Context for global state management
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in by looking for token in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (username, password) => {
    const { data } = await axios.post('http://localhost:5000/api/auth/login', { username, password });
    setUser(data);
    localStorage.setItem('user', JSON.stringify(data));
  };

  // Register function
  const register = async (username, password) => {
    const { data } = await axios.post('http://localhost:5000/api/auth/register', { username, password });
    setUser(data);
    localStorage.setItem('user', JSON.stringify(data));
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
