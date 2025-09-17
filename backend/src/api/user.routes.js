// backend/src/api/user.routes.js

const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary.config.js');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { transactionLimiter } = require('../middleware/rateLimiter');

// This route is public and does not require authentication
router.get('/homepage-announcements', userController.getHomepageAnnouncements);

// All subsequent routes require authentication
router.use(authMiddleware);

// --- Session & Dashboard ---
router.get('/verify', userController.verifyUserToken);
router.get('/dashboard', userController.getDashboardData);
router.put('/profile', userController.updatePayoutWallet);

// --- Financial Actions (with rate limiting) ---
router.post('/activate', userController.activateAccount);
router.post('/withdraw', transactionLimiter, userController.requestWithdrawal);
router.post('/transfer', transactionLimiter, userController.transferFunds);

// --- STBL Token Actions ---
router.post('/claim-stbl-reward', transactionLimiter, userController.claimStblReward);

// --- History Endpoints ---
router.get('/deposits', userController.getDepositHistory);
router.get('/withdrawals', userController.getWithdrawalHistory);
router.get('/commissions', userController.getCommissionHistory);
router.get('/transfers', userController.getFundTransferHistory);
// --- ✅ समाधान: यह रूट अपडेट किया गया है ---
router.get('/announcements', userController.getActiveAnnouncementsForUser);
router.get('/stbl-history', userController.getStblTokenHistory);

// --- Support Ticket Endpoints ---
router.post('/support/tickets', upload.single('attachment'), userController.createTicket);
router.get('/support/tickets', userController.getUserTickets);
router.get('/support/tickets/:id', userController.getTicketById);
router.post('/support/tickets/:id/reply', upload.single('attachment'), userController.createTicketReply);
router.get('/team-tree', userController.getReferralTree);
module.exports = router;
