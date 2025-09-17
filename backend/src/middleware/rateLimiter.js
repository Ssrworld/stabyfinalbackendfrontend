// backend/src/middleware/rateLimiter.js

const rateLimit = require('express-rate-limit');

// सामान्य API रिक्वेस्ट के लिए लिमिटर
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 मिनट
    max: 100, // 15 मिनट में एक IP से 100 रिक्वेस्ट
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true, 
    legacyHeaders: false, 
});

// संवेदनशील ऑथेंटिकेशन राउट्स के लिए और भी सख्त लिमिटर
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 मिनट
    max: 10, // 15 मिनट में एक IP से सिर्फ 10 कोशिशें
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

// --- नया लिमिटर यहाँ जोड़ें ---
// संवेदनशील ट्रांजैक्शन (जैसे निकासी, ट्रांसफर) के लिए लिमिटर
const transactionLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 मिनट
    max: 5, // एक मिनट में 5 संवेदनशील ट्रांजैक्शन
    message: 'Too many transactions from this IP, please try again after a minute.',
    standardHeaders: true,
    legacyHeaders: false,
});


module.exports = {
    apiLimiter,
    authLimiter,
    transactionLimiter, // --- इसे एक्सपोर्ट करें ---
};