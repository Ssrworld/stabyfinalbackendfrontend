const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// .env से आपकी कीज़ को अपने आप कॉन्फ़िगर करेगा
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloudinary के लिए स्टोरेज इंजन बनाएं
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'stabylink_support_tickets', // Cloudinary में फाइलों के लिए एक फोल्डर
    resource_type: 'auto', // इमेज और वीडियो दोनों को स्वीकार करेगा
    allowed_formats: ['jpeg', 'jpg', 'png', 'mp4', 'mov', 'avi']
  }
});

// Multer को Cloudinary स्टोरेज के साथ इनिशियलाइज़ करें
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB फाइल साइज लिमिट
});

module.exports = { upload, cloudinary };