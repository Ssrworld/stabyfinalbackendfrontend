// frontend/src/context/AuthContext.jsx (FIXED)

import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  return useContext(AuthContext);
};

const AuthProvider = ({ children }) => {
  // --- ✅ समाधान: user को null की बजाय एक खाली ऑब्जेक्ट से शुरू करें ---
  const [user, setUser] = useState({}); 
  const [isLoggedIn, setIsLoggedIn] = useState(false); // --- ✅ समाधान: एक अलग 'isLoggedIn' स्टेट जोड़ें ---
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      apiService.verifyToken()
        .then(response => {
          setUser(response.data);
          setIsAdmin(response.data.isAdmin || false);
          setIsLoggedIn(true); // --- ✅ समाधान: लॉग इन स्थिति सेट करें ---
        })
        .catch(() => {
          localStorage.removeItem('token');
          setUser({});
          setIsAdmin(false);
          setIsLoggedIn(false); // --- ✅ समाधान: लॉग आउट स्थिति सेट करें ---
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const response = await apiService.loginUser(credentials);
    localStorage.setItem('token', response.data.token);
    const userResponse = await apiService.verifyToken();
    setUser(userResponse.data);
    setIsAdmin(userResponse.data.isAdmin || false);
    setIsLoggedIn(true); // --- ✅ समाधान: लॉग इन स्थिति सेट करें ---
    return userResponse.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser({});
    setIsAdmin(false);
    setIsLoggedIn(false); // --- ✅ समाधान: लॉग आउट स्थिति सेट करें ---
    navigate('/login');
  };

  const value = {
    user,
    // --- ✅ समाधान: 'user' की जगह 'isLoggedIn' का उपयोग करें ---
    isLoggedIn, 
    isAdmin,
    loading,
    login,
    logout,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;