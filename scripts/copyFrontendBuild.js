// scripts/copyFrontendBuild.js

// --- समाधान: fs-extra के बजाय Node.js के बिल्ट-इन 'fs' और 'path' का उपयोग करें ---
const fs = require('fs');
const path = require('path');

const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
const backendPublic = path.join(__dirname, '..', 'backend', 'public');

try {
    // 1. सुनिश्चित करें कि frontend/dist फोल्डर मौजूद है
    if (!fs.existsSync(frontendDist)) {
        console.error('Error: Frontend build directory "frontend/dist" not found. Build may have failed.');
        process.exit(1);
    }
    
    // 2. यदि backend/public पहले से मौजूद है, तो उसे हटा दें ताकि पुरानी फाइलें न रहें
    if (fs.existsSync(backendPublic)) {
        fs.rmSync(backendPublic, { recursive: true, force: true });
        console.log('Cleaned up old backend/public directory.');
    }
    
    // 3. एक नया, खाली backend/public फोल्डर बनाएं
    fs.mkdirSync(backendPublic, { recursive: true });

    // 4. बिल्ट फ्रंटएंड फाइलों को backend/public में कॉपी करें
    // fs.cpSync Node.js v16.7.0+ में उपलब्ध है, जो Render के Node 22 पर काम करेगा
    fs.cpSync(frontendDist, backendPublic, { recursive: true });
    
    console.log('✅ Frontend build successfully copied to backend/public directory.');

} catch (err) {
    console.error('❌ Error copying frontend build:', err);
    process.exit(1);
}