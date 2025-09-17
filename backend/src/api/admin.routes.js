// backend/src/api/admin.routes.js (FINAL AND CORRECT VERSION)

const express = require('express');
const router = express.Router();

const adminDashboardController = require('../controllers/adminDashboard.controller');
const adminUserController = require('../controllers/adminUser.controller');
const adminTransactionController = require('../controllers/adminTransaction.controller');
const adminTeamController = require('../controllers/adminTeam.controller');
const adminSupportController = require('../controllers/adminSupport.controller');
const adminCommunicationController = require('../controllers/adminCommunication.controller');
const adminRewardController = require('../controllers/adminReward.controller');

// Middlewares
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');
const { upload } = require('../config/cloudinary.config.js');
const { transactionLimiter } = require('../middleware/rateLimiter');

router.use(authMiddleware);
router.use(adminMiddleware);

// =========================================================================
// Dashboard, Health & Reports
// =========================================================================
router.get('/stats', adminDashboardController.getDashboardStats);
router.get('/system-health', adminDashboardController.getSystemHealth);
router.get('/system-metrics', adminDashboardController.getSystemMetrics);
router.get('/financial-report', adminDashboardController.getFinancialReport);
router.get('/financial-report/transactions', adminDashboardController.getFinancialTransactions);
router.get('/activity-logs', adminDashboardController.getAdminActivityLogs);
router.get('/settings', adminDashboardController.getSystemSettings);
router.post('/settings', adminDashboardController.updateSystemSettings);

// =========================================================================
// User Management
// =========================================================================
router.get('/users', adminUserController.getAllUsers);
router.get('/users/export', adminUserController.exportAllUsers);
router.post('/users/credit', transactionLimiter, adminUserController.creditUserFunds);
router.post('/users/debit', transactionLimiter, adminUserController.debitUserFunds);
router.get('/users/:userId', adminUserController.getUserDetails);
router.put('/users/:userId', adminUserController.updateUserDetails);
router.post('/users/:userId/change-sponsor', adminUserController.changeUserSponsor);
router.post('/users/:userId/reset-password', adminUserController.adminResetPassword);
router.post('/users/:userId/impersonate', adminUserController.generateImpersonationToken);
router.post('/users/:userId/set-role', adminUserController.setUserRole);

// =========================================================================
// Team Tree
// =========================================================================
router.get('/matrix/:userId', adminTeamController.getUserMatrix);
router.get('/tree/next-slot', adminTeamController.getNextAvailableSlot);
router.get('/tree/unplaced-queue', adminTeamController.getUnplacedQueue);

// =========================================================================
// Transactions, Earnings & Rewards
// =========================================================================
router.get('/transactions', adminTransactionController.getAllTransactions);
router.get('/transactions/deposit-tracking', adminTransactionController.getDepositTrackingHistory);
router.get('/transactions/p2p-transfers', adminTransactionController.getP2PTransferHistory);
router.get('/earnings/p2p-fees', adminTransactionController.getP2PFeeHistory);
router.get('/earnings', adminTransactionController.getAdminEarnings);
// ✅ THIS ROUTE IS CORRECTLY DEFINED
router.get('/earnings/promoter-payouts', adminTransactionController.getPromoterPayoutsHistory);
router.get('/manual-transactions', adminTransactionController.getAdminTransactionHistory);
router.get('/withdrawals/pending', adminTransactionController.getPendingWithdrawals);
router.put('/withdrawals/:withdrawalId/status', adminTransactionController.updateWithdrawalStatus);
router.get('/stbl-rewards', adminRewardController.getStblRewards);
router.put('/stbl-rewards/:rewardId/status', adminRewardController.updateStblRewardStatus);

// =========================================================================
// Support Tickets
// =========================================================================
router.get('/support/tickets', adminSupportController.getAllTickets);
router.get('/support/tickets-open-count', adminSupportController.getOpenTicketsCount);
router.get('/support/tickets/:id', adminSupportController.getTicketByIdForAdmin);
router.post('/support/tickets/:id/reply', upload.single('attachment'), adminSupportController.createTicketReply);
router.put('/support/tickets/:id/status', adminSupportController.updateTicketStatus);

// =========================================================================
// Communications
// =========================================================================
router.post('/communications/announcements', upload.single('image'), adminCommunicationController.createAnnouncement);
router.get('/communications/announcements', adminCommunicationController.getAnnouncements);
router.put('/communications/announcements/:id/status', adminCommunicationController.updateAnnouncementStatus);
router.delete('/communications/announcements/:id', adminCommunicationController.deleteAnnouncement);
router.post('/communications/send-bulk-email', transactionLimiter, adminCommunicationController.sendBulkEmail);
router.get('/communications/email-queue', adminCommunicationController.getEmailQueue);

module.exports = router;