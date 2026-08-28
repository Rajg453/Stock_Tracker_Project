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

  // Define the base URL for API requests. It uses an environment variable if available, otherwise defaults to localhost.
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Login function
  const login = async (username, password) => {
    // Make a POST request to the login endpoint using the dynamic API URL
    const { data } = await axios.post(`${API_URL}/auth/login`, { username, password });

    // Save the user data to state and local storage
    setUser(data);
    localStorage.setItem('user', JSON.stringify(data));
  };

  // Register function
  // We define an async arrow function to handle the registration since network requests are asynchronous
  const register = async (username, password) => {
    // We 'await' the result of the POST request to our backend registration endpoint
    const { data } = await axios.post(`${API_URL}/auth/register`, { username, password });
    
    // Update the local state with the newly registered user data
    setUser(data);
    
    // Save the user data in the browser's local storage so it persists across page reloads
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
