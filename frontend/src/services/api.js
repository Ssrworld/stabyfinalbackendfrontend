// frontend/src/services/api.js (FINAL CLEANED-UP VERSION)

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || '/api',
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- ✅ BADLAV: Yahan se saare 'export' keyword hata diye gaye hain ---

// --- AUTHENTICATION ---
const registerUser = (userData) => api.post('/auth/register', userData);
const loginUser = (userData) => api.post('/auth/login', userData);
const forgotPassword = (emailData) => api.post('/auth/forgot-password', emailData);
const resetPassword = (resetData) => api.post('/auth/reset-password', resetData);
const loginWithToken = (token) => api.post('/auth/impersonate-login', { token });

// --- USER DASHBOARD & SESSION ---
const verifyToken = () => api.get('/user/verify');
const getDashboardData = () => api.get('/user/dashboard');
const updatePayoutWallet = (walletData) => api.put('/user/profile', walletData);
const requestWithdrawal = (amountData) => api.post('/user/withdraw', amountData);
const activateAccount = () => api.post('/user/activate');
const transferFunds = (transferData) => api.post('/user/transfer', transferData);
const getDepositHistory = () => api.get('/user/deposits');
const getWithdrawalHistory = () => api.get('/user/withdrawals');
const getCommissionHistory = () => api.get('/user/commissions');
const getFundTransferHistory = () => api.get('/user/transfers');
const getLatestAnnouncements = () => api.get('/user/announcements');
const claimStblReward = (walletData) => api.post('/user/claim-stbl-reward', walletData);
const getStblTokenHistory = () => api.get('/user/stbl-history');
const getHomepageAnnouncements = () => api.get('/user/homepage-announcements');
const getReferralTree = () => api.get('/user/team-tree');

// --- PROMOTER PANEL ---
const getPromoterStats = () => api.get('/promoter/dashboard-stats');
const getPromoterCommissions = () => api.get('/promoter/commissions');

// --- PUBLIC STATS ---
const getPublicStats = () => api.get('/stats/public');

// --- ADMIN PANEL ---
const getAdminStats = () => api.get('/admin/stats');
const getAdminAllUsers = (page = 1, search = '', filter = 'ALL') => api.get(`/admin/users?search=${search}&filter=${filter}&page=${page}`);
const exportAdminUsers = (search = '') => api.get(`/admin/users/export?search=${search}`, { responseType: 'blob' });
const getAdminAllTransactions = (type = 'all', search = '') => api.get(`/admin/transactions?type=${type}&search=${search}`);
const getAdminDepositTracking = (search = '') => api.get(`/admin/transactions/deposit-tracking?search=${search}`);
const getAdminP2PTransfers = () => api.get('/admin/transactions/p2p-transfers');
const getAdminP2PFees = () => api.get('/admin/earnings/p2p-fees');
const getAdminEarnings = () => api.get('/admin/earnings');
const getAdminPromoterPayouts = () => api.get('/admin/earnings/promoter-payouts');
const creditUserFunds = (data) => api.post('/admin/users/credit', data);
const debitUserFunds = (data) => api.post('/admin/users/debit', data);
const getAdminUserDetails = (userId) => api.get(`/admin/users/${userId}`);
const updateAdminUserDetails = (userId, userData) => api.put(`/admin/users/${userId}`, userData);
const adminResetUserPassword = (userId, newPassword) => api.post(`/admin/users/${userId}/reset-password`, { newPassword });
const adminSetUserRole = (userId, role) => api.post(`/admin/users/${userId}/set-role`, { role });
const generateImpersonationToken = (userId) => api.post(`/admin/users/${userId}/impersonate`);
const changeUserSponsor = (userId, newSponsorEmail) => api.post(`/admin/users/${userId}/change-sponsor`, { newSponsorEmail });
const getAdminSettings = () => api.get('/admin/settings');
const updateAdminSettings = (settings) => api.post('/admin/settings', settings);
const getAdminManualTransactions = () => api.get('/admin/manual-transactions');
const getOpenTicketsCount = () => api.get('/admin/support/tickets-open-count');
const getSystemHealth = () => api.get('/admin/system-health');
const getSystemMetrics = () => api.get('/admin/system-metrics');
const getAdminUserMatrix = (userId) => api.get(`/admin/matrix/${userId}`);
const getNextAvailableSlot = () => api.get('/admin/tree/next-slot');
const getUnplacedQueue = () => api.get('/admin/tree/unplaced-queue');
const getFinancialReport = () => api.get('/admin/financial-report');
const getFinancialTransactions = () => api.get('/admin/financial-report/transactions');
const getPendingWithdrawals = () => api.get('/admin/withdrawals/pending');
const updateWithdrawalStatus = (id, data) => api.put(`/admin/withdrawals/${id}/status`, data);
const getAdminActivityLogs = () => api.get('/admin/activity-logs');
const getAdminStblRewards = () => api.get('/admin/stbl-rewards');
const updateAdminStblRewardStatus = (rewardId, data) => api.put(`/admin/stbl-rewards/${rewardId}/status`, data);

// --- Communications ---
const createAnnouncement = (formData) => api.post('/admin/communications/announcements', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
const getAnnouncements = () => api.get('/admin/communications/announcements');
const updateAnnouncementStatus = (id, status) => api.put(`/admin/communications/announcements/${id}/status`, { status });
const deleteAnnouncement = (id) => api.delete(`/admin/communications/announcements/${id}`);
const sendBulkEmail = (data) => api.post('/admin/communications/send-bulk-email', data);
const getEmailQueue = () => api.get('/admin/communications/email-queue');

// --- SUPPORT TICKETS (USER) ---
const createSupportTicket = (formData) => api.post('/user/support/tickets', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
const getUserTickets = () => api.get('/user/support/tickets');
const getUserTicketById = (id) => api.get(`/user/support/tickets/${id}`);
const postUserTicketReply = (id, formData) => api.post(`/user/support/tickets/${id}/reply`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// --- SUPPORT TICKETS (ADMIN) ---
const getAdminAllTickets = () => api.get('/admin/support/tickets');
const getAdminTicketById = (id) => api.get(`/admin/support/tickets/${id}`);
const postAdminTicketReply = (id, formData) => api.post(`/admin/support/tickets/${id}/reply`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
const updateAdminTicketStatus = (id, statusData) => api.put(`/admin/support/tickets/${id}/status`, statusData);

// ✅ SABSE ZAROORI BADLAV: Ab hum saare functions ko ek object me daal kar, usi ko export karenge
const apiService = {
    ...api,
    registerUser, loginUser, forgotPassword, resetPassword, loginWithToken,
    verifyToken, getDashboardData, updatePayoutWallet, requestWithdrawal,
    activateAccount, transferFunds, getDepositHistory, getWithdrawalHistory,
    getCommissionHistory, getFundTransferHistory, getLatestAnnouncements,
    claimStblReward, getStblTokenHistory, getHomepageAnnouncements,
    getReferralTree, getPromoterStats, getPromoterCommissions,
    getPublicStats,
    getAdminStats, getAdminAllUsers, exportAdminUsers, getAdminAllTransactions,
    getAdminDepositTracking, getAdminP2PTransfers, getAdminP2PFees,
    getAdminEarnings, 
    getAdminPromoterPayouts,
    creditUserFunds, debitUserFunds, getAdminUserDetails,
    updateAdminUserDetails, adminResetUserPassword, adminSetUserRole,
    generateImpersonationToken, changeUserSponsor, getAdminSettings, updateAdminSettings,
    getAdminManualTransactions, getOpenTicketsCount, getSystemHealth,
    getSystemMetrics, getAdminUserMatrix, getNextAvailableSlot, getUnplacedQueue,
    getFinancialReport, getFinancialTransactions, getPendingWithdrawals,
    updateWithdrawalStatus, getAdminActivityLogs, getAdminStblRewards,
    updateAdminStblRewardStatus, createAnnouncement, getAnnouncements,
    updateAnnouncementStatus, deleteAnnouncement, sendBulkEmail, getEmailQueue,
    createSupportTicket, getUserTickets, getUserTicketById, postUserTicketReply,
    getAdminAllTickets, getAdminTicketById, postAdminTicketReply, updateAdminTicketStatus
};

// Yahan se sirf default object hi export ho raha hai
export default apiService;