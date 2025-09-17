// frontend/src/components/admin/AdminLayout.jsx (FULL FILE WITH NEW LINK)

import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout } = useAuth();

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 992) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`admin-layout ${isSidebarCollapsed ? 'sidebar-closed' : ''} ${isMobileMenuOpen ? 'mobile-sidebar-open' : ''}`}>
      
      {isMobileMenuOpen && <div className="mobile-overlay" onClick={toggleMobileMenu}></div>}

      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">Stabylink Admin</h2>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <i className={`fa-solid ${isSidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
          </button>
        </div>
        <nav className="admin-nav">
          <NavLink to="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)}><i className="fa-solid fa-tachometer-alt"></i><span>Dashboard</span></NavLink>
          <NavLink to="/admin/financial-report" onClick={() => setIsMobileMenuOpen(false)}><i className="fa-solid fa-chart-pie"></i><span>Financial Report</span></NavLink>
          <NavLink to="/admin/users" onClick={() => setIsMobileMenuOpen(false)}><i className="fa-solid fa-users"></i><span>Manage Users</span></NavLink>
          <NavLink to="/admin/team-tree" onClick={() => setIsMobileMenuOpen(false)}><i className="fa-solid fa-sitemap"></i><span>Team Tree</span></NavLink>
          <NavLink to="/admin/transactions" onClick={() => setIsMobileMenuOpen(false)}><i className="fa-solid fa-exchange-alt"></i><span>All Transactions</span></NavLink>
          <NavLink to="/admin/transactions/p2p-history" onClick={() => setIsMobileMenuOpen(false)} style={{ paddingLeft: '2.5rem' }}>
            <i className="fa-solid fa-people-arrows"></i><span>P2P History</span>
          </NavLink>
          <NavLink to="/admin/earnings/p2p-fees" onClick={() => setIsMobileMenuOpen(false)} style={{ paddingLeft: '2.5rem' }}>
             <i className="fa-solid fa-hand-holding-dollar"></i><span>P2P Fee Earnings</span>
          </NavLink>
          {/* ✅ ADD NEW NAVLINK HERE */}
          <NavLink to="/admin/promoter-payouts" onClick={() => setIsMobileMenuOpen(false)} style={{ paddingLeft: '2.5rem' }}>
            <i className="fa-solid fa-crown"></i><span>Promoter Payouts</span>
          </NavLink>
          <NavLink to="/admin/deposit-tracking" onClick={() => setIsMobileMenuOpen(false)}><i className="fa-solid fa-magnifying-glass-dollar"></i><span>Deposit Tracking</span></NavLink>
          <NavLink to="/admin/withdrawals" onClick={() => setIsMobileMenuOpen(false)}><i className="fa-solid fa-hourglass-half"></i><span>Pending Withdrawals</span></NavLink>
          <NavLink to="/admin/stbl-rewards" onClick={() => setIsMobileMenuOpen(false)}><i className="fa-solid fa-star"></i><span>STBL Rewards</span></NavLink>
          <NavLink to="/admin/tickets" onClick={() => setIsMobileMenuOpen(false)}><i className="fa-solid fa-headset"></i><span>Support Tickets</span></NavLink>
          <NavLink to="/admin/communications" onClick={() => setIsMobileMenuOpen(false)}><i className="fa-solid fa-bullhorn"></i><span>Communications</span></NavLink>
          <NavLink to="/admin/communications/email-report" onClick={() => setIsMobileMenuOpen(false)}>
            <i className="fa-solid fa-envelope-open-text"></i><span>Email Report</span>
          </NavLink>
          <NavLink to="/admin/activity-log" onClick={() => setIsMobileMenuOpen(false)}><i className="fa-solid fa-list-check"></i><span>Activity Log</span></NavLink>
          <NavLink to="/admin/settings" onClick={() => setIsMobileMenuOpen(false)}>
              <i className="fa-solid fa-cog"></i><span>Settings</span>
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <button onClick={logout} className="logout-button">
            <i className="fa-solid fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>
      
      <div className="admin-main-content-wrapper">
          <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
              <i className={`fa-solid ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
          <main className="admin-main-content">
              {children}
          </main>
      </div>
    </div>
  );
};

export default AdminLayout;