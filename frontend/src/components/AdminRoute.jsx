// frontend/src/components/AdminRoute.jsx (FIXED)

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminLayout from './admin/AdminLayout';

const AdminRoute = () => {
  // --- ✅ समाधान: 'user' की जगह 'isLoggedIn' का उपयोग करें ---
  const { isLoggedIn, isAdmin, loading } = useAuth();

  if (loading) {
    return <div>Loading authentication status...</div>;
  }

  // यदि उपयोगकर्ता लॉग इन है और एक एडमिन है, तो एडमिन कंटेंट दिखाएं
  if (isLoggedIn && isAdmin) {
    return (
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    );
  }

  // यदि कोई भी स्थिति मेल नहीं खाती, तो लॉगिन पेज पर भेजें
  return <Navigate to="/login" replace />;
};

export default AdminRoute;