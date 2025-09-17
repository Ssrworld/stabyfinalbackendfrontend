// frontend/src/App.jsx (FULL FILE WITH NEW ROUTE)

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import EmailReportPage from './pages/admin/EmailReportPage';

// Layouts
import Layout from './components/Layout';
import AdminLayout from './components/admin/AdminLayout';

// Public Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// User Pages
import DashboardPage from './pages/DashboardPage';
import SupportPage from './pages/SupportPage';
import TicketView from './components/TicketView';
import TeamPage from './pages/TeamPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import UserDetailsPage from './pages/admin/UserDetailsPage';
import TeamTreePage from './pages/admin/TeamTreePage';
import ManageTransactions from './pages/admin/ManageTransactions';
import WithdrawalManagementPage from './pages/admin/WithdrawalManagementPage';
import StblRewardManagement from './pages/admin/StblRewardManagement';
import ManageTickets from './pages/admin/ManageTickets';
import CommunicationsPage from './pages/admin/CommunicationsPage';
import ActivityLogPage from './pages/admin/ActivityLogPage';
import FinancialReportPage from './pages/admin/FinancialReportPage';
import ManualTransactions from './pages/admin/ManualTransactions';
import AdminEarnings from './pages/admin/AdminEarnings';
import DepositTrackingPage from './pages/admin/DepositTrackingPage';
import P2PTransferHistoryPage from './pages/admin/P2PTransferHistoryPage';
import P2PFeeHistoryPage from './pages/admin/P2PFeeHistoryPage';
import SettingsPage from './pages/admin/SettingsPage';
import PromoterPayoutsPage from './pages/admin/PromoterPayoutsPage'; // ✅ IMPORT THE NEW PAGE

// Route Guards
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="register/:referralCode" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="support" element={<SupportPage />} />
            <Route path="support/ticket/:id" element={<TicketView />} />
            <Route path="support/ticket/new" element={<TicketView isNew={true} />} />
          </Route>
        </Route>

        <Route path="/admin" element={<AdminRoute />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="financial-report" element={<FinancialReportPage />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="users/:userId" element={<UserDetailsPage />} />
            <Route path="team-tree" element={<TeamTreePage />} />
            <Route path="team-tree/:userId" element={<TeamTreePage />} />
            <Route path="transactions" element={<ManageTransactions />} />
            <Route path="transactions/p2p-history" element={<P2PTransferHistoryPage />} />
            <Route path="earnings/p2p-fees" element={<P2PFeeHistoryPage />} />
            {/* ✅ ADD THE NEW ROUTE HERE */}
            <Route path="promoter-payouts" element={<PromoterPayoutsPage />} />
            <Route path="deposit-tracking" element={<DepositTrackingPage />} />
            <Route path="withdrawals" element={<WithdrawalManagementPage />} />
            <Route path="stbl-rewards" element={<StblRewardManagement />} />
            <Route path="tickets" element={<ManageTickets />} />
            <Route path="tickets/:id" element={<TicketView isAdmin={true} />} />
            <Route path="communications" element={<CommunicationsPage />} />
            <Route path="communications/email-report" element={<EmailReportPage />} /> 
            <Route path="activity-log" element={<ActivityLogPage />} />
            <Route path="manual-transactions" element={<ManualTransactions />} />
            <Route path="earnings" element={<AdminEarnings />} />
            <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      <ToastContainer 
        position="bottom-right" autoClose={5000} hideProgressBar={false}
        newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss
        draggable pauseOnHover theme="dark"
      />
    </>
  );
}

export default App;