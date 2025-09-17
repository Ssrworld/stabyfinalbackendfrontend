// backend/server.js (PURA FIX KIYA HUA CODE)

const path = require('path');
// .env फ़ाइल को केवल तभी लोड करें जब NODE_ENV 'production' न हो
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
}

// यह डीबगिंग कोड डिप्लॉयमेंट के समय एनवायरनमेंट वेरिएबल्स की जाँच करने में मदद करता है।
console.log('--- ENV CHECK ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Cloudinary Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('Cloudinary API Key:', process.env.CLOUDINARY_API_KEY ? 'Loaded' : '!!! NOT LOADED !!!');
console.log('ENCRYPTION_PASSWORD:', process.env.ENCRYPTION_PASSWORD ? 'Loaded' : '!!! NOT LOADED !!!');
console.log('BSC_MAINNET_RPC_URL:', process.env.BSC_MAINNET_RPC_URL ? 'Loaded' : '!!! NOT LOADED !!!');
console.log('-----------------');

const express = require('express');
const cors = require('cors');
const { apiLimiter } = require('./src/middleware/rateLimiter');
const { bootstrapDatabase } = require('./src/scripts/bootstrap');

const app = express();

// Render जैसे प्रॉक्सी के पीछे चलने के लिए यह आवश्यक है
app.set('trust proxy', 1);

// CORS middleware ko configure karein
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', 
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json());

// सभी API रूट्स पर सामान्य रेट लिमिटर लागू करें
app.use('/api/', apiLimiter);

// --- API Routes (यह हमेशा कैच-ऑल रूट से पहले परिभाषित होना चाहिए) ---
const authRoutes = require('./src/api/auth.routes');
const userRoutes = require('./src/api/user.routes');
const statsRoutes = require('./src/api/stats.routes');
const adminRoutes = require('./src/api/admin.routes');
const promoterRoutes = require('./src/api/promoter.routes');

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/promoter', promoterRoutes);


// --- ✅ YAHAN BADLAV KIYA GAYA HAI ---
// Purana code jo 'public/index.html' file dhundhta tha, use hata diya gaya hai.
// Ab agar koi non-API URL (jaise root URL) hit karta hai, to use ek saaf message milega.
// Ye ENOENT error ko fix kar dega.
app.get('*', (req, res) => {
  res.status(200).json({ 
    message: 'Welcome to the Stabylink API.',
    status: 'Healthy',
    documentation: 'This is a private API. Please use the designated frontend application to interact with this service.' 
  });
});
// --- BADLAV KHATAM ---


const PORT = process.env.PORT || 3000;

async function startServer() {
  await bootstrapDatabase(); 
  app.listen(PORT, () => console.log(`[Server] Backend server running on port ${PORT}`));
}

startServer();