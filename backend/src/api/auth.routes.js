// backend/src/api/auth.routes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authLimiter } = require('../middleware/rateLimiter');

// इस राउटर पर आने वाली सभी रिक्वेस्ट पर 'authLimiter' लागू करें
router.use(authLimiter);

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/impersonate-login', authController.loginWithImpersonationToken);

module.exports = router;