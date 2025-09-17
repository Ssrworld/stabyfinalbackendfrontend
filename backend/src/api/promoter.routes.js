const express = require('express');
const router = express.Router();

const promoterController = require('../controllers/promoter.controller');
const authMiddleware = require('../middleware/auth.middleware');

// इस फाइल के सभी रूट्स के लिए प्रमाणीकरण (authentication) आवश्यक है
router.use(authMiddleware);

// --- प्रमोटर के लिए विशेष API रूट्स ---

// प्रमोटर डैशबोर्ड के आँकड़े प्राप्त करें
router.get('/dashboard-stats', promoterController.getPromoterStats);

// प्रमोटर की कमीशन हिस्ट्री प्राप्त करें
router.get('/commissions', promoterController.getPromoterCommissions);


// भविष्य में आप और भी रूट्स जोड़ सकते हैं, जैसे:
// router.get('/marketing-tools', promoterController.getMarketingTools);

module.exports = router;