// frontend/src/components/ProtectedRoute.jsx (FIXED)

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  // --- ✅ समाधान: 'user' की जगह 'isLoggedIn' का उपयोग करें ---
  const { isLoggedIn, isAdmin, loading } = useAuth();

  if (loading) {
    return <div>Loading session...</div>; 
  }

  // यदि उपयोगकर्ता लॉग इन है और एडमिन नहीं है, तो सामान्य डैशबोर्ड दिखाएं
  if (isLoggedIn && !isAdmin) {
    return <Outlet />;
  }
  
  // यदि उपयोगकर्ता एक एडमिन है, तो उसे एडमिन डैशबोर्ड पर भेजें
  if (isLoggedIn && isAdmin) {
      return <Navigate to="/admin/dashboard" replace />;
  }

  // यदि उपयोगकर्ता लॉग इन नहीं है, तो लॉगिन पेज पर भेजें
  return <Navigate to="/login" replace />;
};

export default ProtectedRoute;