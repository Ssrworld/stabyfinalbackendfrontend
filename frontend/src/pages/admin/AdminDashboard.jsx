// frontend/src/pages/admin/AdminDashboard.jsx (FINAL A-to-Z CODE)

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; 
import apiService from '../../services/api';
import './Admin.css';
import SystemHealthMonitor from '../../components/admin/SystemHealthMonitor';
import SystemMetrics from '../../components/admin/SystemMetrics';

const AdminStatCard = ({ title, value, icon, linkTo }) => {
  const cardContent = (
    <div className="admin-stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-title">{title}</div>
    </div>
  );
  return linkTo ? <Link to={linkTo} className="stat-card-link">{cardContent}</Link> : cardContent;
};

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const statsResponse = await apiService.getAdminStats();
        setStats(statsResponse.data);
      } catch (err) {
        setError('Failed to load admin data.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdminData();
  }, []);

  if (loading) return <div className="admin-page-container">Loading Admin Dashboard...</div>;
  if (error) return <div className="admin-page-container error-message">{error}</div>;
  if (!stats) return <div className="admin-page-container">No stats data available.</div>;

  return (
    <div className="admin-page-container">
      <h1>Admin Dashboard</h1>
      
      <h3 className="section-title">Admin Revenue & Payouts</h3>
      <div className="admin-stats-grid five-cols">
        <AdminStatCard title="Admin Joining Fees" value={`$${stats.adminJoiningFees}`} icon={<i className="fa-solid fa-user-plus"></i>} />
        <AdminStatCard title="Admin Direct Referral Fees" value={`$${stats.adminDirectReferralFees}`} icon={<i className="fa-solid fa-user-shield"></i>} />
        <AdminStatCard title="Paid to User Sponsors" value={`$${stats.userReferralBonusPayouts}`} icon={<i className="fa-solid fa-users-line"></i>} />
        <AdminStatCard title="Paid to Promoters" value={`$${stats.totalPromoterPayouts || '0.00'}`} icon={<i className="fa-solid fa-crown"></i>} linkTo="/admin/promoter-payouts" />
        <AdminStatCard title="Admin Withdrawal Fees" value={`$${stats.adminWithdrawalFees}`} icon={<i className="fa-solid fa-hand-holding-dollar"></i>} />
      </div>

      <h3 className="section-title">Pool Financials</h3>
      <div className="admin-stats-grid five-cols">
        <AdminStatCard title="Total Turnover" value={`$${stats.totalTurnover}`} icon={<i className="fa-solid fa-chart-line"></i>} />
        <AdminStatCard title="Total Pool Contributions" value={`$${stats.totalPoolContribution}`} icon={<i className="fa-solid fa-arrow-down-to-bracket"></i>} />
        <AdminStatCard title="Total Pool Payouts" value={`$${stats.totalPoolPayouts}`} icon={<i className="fa-solid fa-upload"></i>} />
        <AdminStatCard title="Total Withdrawn by Users" value={`$${stats.totalWithdrawnByUsers}`} icon={<i className="fa-solid fa-money-check-dollar"></i>} />
        <AdminStatCard title="Current Pool Balance" value={`$${stats.currentPoolBalance}`} icon={<i className="fa-solid fa-scale-balanced"></i>} />
      </div>

      <h3 className="section-title">User & System Stats</h3>
      <div className="admin-stats-grid four-cols">
        <AdminStatCard title="Total Users" value={stats.totalUsers} icon={<i className="fa-solid fa-users"></i>} linkTo="/admin/users" />
        <AdminStatCard title="Active Users" value={stats.activeUsers} icon={<i className="fa-solid fa-user-check"></i>} />
        
        <AdminStatCard 
          title="System Wallet Balance" 
          value={`$${stats.systemWalletBalance}`} // ✅✅✅ यह लाइन अब सही प्रॉपर्टी का उपयोग कर रही है ✅✅✅
          icon={<i className="fa-solid fa-wallet"></i>} 
        />
        
        <AdminStatCard title="Pending Withdrawals" value={stats.pendingWithdrawals} icon={<i className="fa-solid fa-hourglass-half"></i>} linkTo="/admin/withdrawals" />
      </div>
      
      <h3 className="section-title">STBL Token Rewards</h3>
      <div className="admin-stats-grid two-cols">
        <AdminStatCard title="Total STBL Awarded" value={stats.totalStblAwarded} icon={<i className="fa-solid fa-star"></i>} />
        <AdminStatCard title="Pending Transfers" value={stats.pendingStblTransfers} icon={<i className="fa-solid fa-hourglass-start"></i>} linkTo="/admin/stbl-rewards" />
      </div>
      
      <SystemMetrics />
      <SystemHealthMonitor />
      
    </div>
  );
}

export default AdminDashboard;