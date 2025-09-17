// backend/src/services/crypto.service.js

const crypto = require('crypto');
const { promisify } = require('util'); 
const ENCRYPTION_PASSWORD = process.env.ENCRYPTION_PASSWORD;
if (!ENCRYPTION_PASSWORD || ENCRYPTION_PASSWORD.length < 16) {
    throw new Error('FATAL: ENCRYPTION_PASSWORD in .env file must be at least 16 characters long for security.');
}

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const KEY_LENGTH = 32;
const ITERATIONS = 100000; 

const pbkdf2Async = promisify(crypto.pbkdf2);

/**
 * 
 * @param {string} text 
 * @returns {Promise<string>} 
 */
exports.encrypt = async (text) => {
    
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    
    const key = await pbkdf2Async(ENCRYPTION_PASSWORD, salt, ITERATIONS, KEY_LENGTH, 'sha512');
    
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    
    return `${salt.toString('hex')}:${iv.toString('hex')}:${encrypted}`;
};

/**
 * 
 * @param {string} encryptedString 
 * @returns {Promise<string|null>} 
 */
exports.decrypt = async (encryptedString) => {
    try {
        const parts = encryptedString.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted string format.');
        }

        const salt = Buffer.from(parts[0], 'hex');
        const iv = Buffer.from(parts[1], 'hex');
        const encryptedText = parts[2];
        
        
        const key = await pbkdf2Async(ENCRYPTION_PASSWORD, salt, ITERATIONS, KEY_LENGTH, 'sha512');
        
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
      
        console.error("Decryption failed:", error.message);
        return null;
    }
};