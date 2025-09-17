// backend/src/controllers/auth.controller.js (A-to-Z CODE TO ENFORCE REFERRAL)

const db = require('../config/db.config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { encrypt } = require('../services/crypto.service');
const { createHtmlEmail, trySendEmailOrQueue } = require('../services/email.service');
const crypto = require('crypto');
const { nanoid } = require('nanoid');
const bip39 = require('bip39');
const { hdkey } = require('ethereumjs-wallet');
const QRCode = require('qrcode');
const { cloudinary } = require('../config/cloudinary.config');

const MASTER_MNEMONIC = process.env.USER_WALLETS_MASTER_MNEMONIC;
const MASTER_WALLET_ADDRESS = process.env.MASTER_WALLET_ADDRESS;

if (!MASTER_MNEMONIC || !MASTER_WALLET_ADDRESS) {
    throw new Error("FATAL: USER_WALLETS_MASTER_MNEMONIC and MASTER_WALLET_ADDRESS must be set in the .env file.");
}

const isStrongPassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;
    return regex.test(password);
};

exports.register = async (req, res) => {
    const { email, password, referralCode, mobile_number } = req.body;
    if (!email || !password || !mobile_number) { return res.status(400).json({ message: 'Email, mobile number, and password are required.' }); }
    if (!isStrongPassword(password)) { return res.status(400).json({ message: 'Password is not strong enough.' }); }

    try {
        const existingUserByEmail = await db('users').where({ email }).first();
        if (existingUserByEmail) { return res.status(409).json({ message: 'This email is already in use.' }); }
        const existingUserByMobile = await db('users').where({ mobile_number }).first();
        if (existingUserByMobile) { return res.status(409).json({ message: 'This mobile number is already in use.' }); }
        
        // ✅✅✅ START: सर्वर-साइड पर रेफरल कोड की अनिवार्यता और वैधता की जाँच ✅✅✅
        if (!referralCode) {
            return res.status(400).json({ message: 'A referral code is required to register.' });
        }

        // रेफरर को ढूंढें और सुनिश्चित करें कि वह सक्रिय है
        const referrer = await db('users').where({ referral_code: referralCode, status: 'ACTIVE' }).first('id');

        if (!referrer) {
            return res.status(400).json({ message: 'The provided referral code is invalid or the referrer is not active.' });
        }
        const referred_by_id = referrer.id;
        // ✅✅✅ END: जाँच ✅✅✅
        
        const userReferralCode = nanoid(10);
        
        const newUserInfo = await db.transaction(async trx => {
            const hashedPassword = await bcrypt.hash(password, 10);
            const userData = { email, mobile_number, password_hash: hashedPassword, wallet_address: 'GENERATING...', encrypted_mnemonic: 'PENDING', referral_code: userReferralCode, referred_by: referred_by_id };
            
            const [result] = await trx('users').insert(userData).returning('id');
            const insertedId = (typeof result === 'object') ? result.id : result;
            if (!insertedId) { throw new Error("Could not retrieve new user ID after insertion."); }
            
            const seed = await bip39.mnemonicToSeed(MASTER_MNEMONIC);
            const masterNode = hdkey.fromMasterSeed(seed);
            const derivationPath = `m/44'/60'/0'/0/${insertedId}`;
            const childNode = masterNode.derivePath(derivationPath);
            const walletAddress = childNode.getWallet().getAddressString();
            if (walletAddress.toLowerCase() === MASTER_WALLET_ADDRESS.toLowerCase()) { throw new Error("Critical security error during wallet generation."); }
            
            const encryptedDerivationIndex = await encrypt(insertedId.toString());
            await trx('users').where('id', insertedId).update({ wallet_address: walletAddress, encrypted_mnemonic: encryptedDerivationIndex });
            
            const subject = 'Welcome to Stabylink! Your Account Details';
            const headline = 'Welcome Aboard!';
            const rewardsUrl = process.env.FRONTEND_URL || 'https://rewards.stabylink.com';
            const referralLink = `${rewardsUrl}/register/${userReferralCode}`;
            
            const depositQrDataUrl = await QRCode.toDataURL(walletAddress, { errorCorrectionLevel: 'H', margin: 1, color: { dark: '#FFFFFF', light: '#0000' } });
            const referralQrDataUrl = await QRCode.toDataURL(referralLink, { errorCorrectionLevel: 'H', margin: 1, color: { dark: '#FFFFFF', light: '#0000' } });
            
            const [uploadedDepositQr, uploadedReferralQr] = await Promise.all([
                cloudinary.uploader.upload(depositQrDataUrl, { folder: 'qrcodes', public_id: `deposit_${insertedId}`, overwrite: true }),
                cloudinary.uploader.upload(referralQrDataUrl, { folder: 'qrcodes', public_id: `referral_${insertedId}`, overwrite: true })
            ]);
            
            const depositQrPublicUrl = uploadedDepositQr.secure_url;
            const referralQrPublicUrl = uploadedReferralQr.secure_url;
            
            const content = `
                <p style="text-align: left;">Thank you for joining the Stabylink community! Your account has been successfully created. Below are the essential details to get you started on your rewards journey.</p>
                <p style="margin: 25px 0; text-align: left;"><strong>Login Email:</strong> <a href="mailto:${email}" style="color: #57a6ff;">${email}</a></p>
                <p style="margin-bottom: 30px; font-size: 14px; color: #ffcc00; text-align: left;"><strong>Important:</strong> For your security, we do not send your password via email.</p>
                <h3 style="color: #ffffff; text-align:center; font-size: 20px; margin-top: 10px; margin-bottom: 10px;">Step 1: Activate Your Account</h3>
                <p style="text-align:center; color: #a0a0e0; font-size: 15px;">To start earning, deposit exactly <strong>$20 USDT (BEP-20)</strong> to your unique address below. Your account will be activated automatically upon confirmation.</p>
                <div style="background-color: #0d0c22; border: 1px solid #2a2a4a; padding: 20px; border-radius: 8px; text-align: center; margin-top: 20px;">
                    <p style="font-family: monospace; font-size: 14px; color: #e0e0e0; word-break: break-all; margin: 0 0 15px 0;">${walletAddress}</p>
                    <img src="${depositQrPublicUrl}" alt="Deposit Address QR Code" style="border-radius: 8px; width: 150px; height: 150px; display: block; margin: 0 auto;">
                </div>
                <h3 style="color: #ffffff; text-align:center; font-size: 20px; margin-top: 30px; margin-bottom: 10px;">Step 2: Share Your Referral Link</h3>
                <p style="text-align:center; color: #a0a0e0; font-size: 15px;">Share this link to build your team and earn instant commissions. You can share the link or the QR code.</p>
                <div style="background-color: #0d0c22; border: 1px solid #2a2a4a; padding: 20px; border-radius: 8px; text-align: center; margin-top: 20px;">
                    <p style="font-size: 14px; color: #e0e0e0; word-break: break-all; margin: 0 0 15px 0;"><a href="${referralLink}" style="color: #57a6ff;"><strong>${referralLink}</strong></a></p>
                    <img src="${referralQrPublicUrl}" alt="Referral Link QR Code" style="border-radius: 8px; width: 150px; height: 150px; display: block; margin: 0 auto;">
                </div>
            `;
            const fullHtmlContent = createHtmlEmail(headline, content, subject);
            
            await trySendEmailOrQueue(email, subject, fullHtmlContent, [], trx);
            
            return { id: insertedId, walletAddress: walletAddress };
        });
        
        res.status(201).json({ 
            message: 'User registered successfully.', 
            userId: newUserInfo.id,
            depositAddress: newUserInfo.walletAddress 
        });

    } catch (error) {
        console.error("REGISTRATION ERROR:", error);
        res.status(500).json({ message: 'Server error during registration. Please try again later.' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db('users').where('email', email).first();
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        if (user.is_suspended) {
            return res.status(403).json({ message: 'Your account has been suspended. Please contact support.' });
        }
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        const isAdmin = user.id === 1;
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ message: 'Login successful', token, isAdmin });
    } catch (error) {
        console.error("LOGIN ERROR:", error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        await db.transaction(async trx => {
            const user = await trx('users').where({ email }).first('id');
            if (user) {
                const otp = crypto.randomInt(100000, 999999).toString();
                const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
                await trx('users').where({ email }).update({ otp, otp_expires: otpExpires });
                const subject = 'Your Password Reset OTP';
                const headline = 'Password Reset Request';
                const content = `<p>Your One-Time Password (OTP) is:</p><p style="font-size: 28px; font-weight: bold; text-align: center; color: #ffffff; background-color: #0d0c22; padding: 10px; border-radius: 8px; letter-spacing: 4px;">${otp}</p><p>This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>`;
                const fullHtmlContent = createHtmlEmail(headline, content, subject);
                await trySendEmailOrQueue(email, subject, fullHtmlContent, [], trx);
            }
        });
        res.json({ message: 'If an account with that email exists, an OTP has been sent.' });
    } catch (error) {
        console.error("FORGOT PASSWORD ERROR:", error);
        res.status(500).json({ message: 'An error occurred. Please try again later.' });
    }
};

exports.resetPassword = async (req, res) => {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password || !isStrongPassword(password)) {
        return res.status(400).json({ message: 'Valid email, OTP, and a strong password are required.' });
    }
    try {
        const user = await db('users').where({ email, otp }).first();
        if (!user || new Date() > new Date(user.otp_expires)) {
            return res.status(400).json({ message: 'OTP is invalid or has expired.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await db('users').where({ email }).update({ password_hash: hashedPassword, otp: null, otp_expires: null });
        res.json({ message: 'Password has been reset successfully.' });
    } catch (error) {
        console.error("RESET PASSWORD ERROR:", error);
        res.status(500).json({ message: 'An error occurred.' });
    }
};

exports.loginWithImpersonationToken = async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ message: 'Impersonation token is required.' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.impersonating) {
            return res.status(401).json({ message: 'Not an impersonation token.' });
        }
        const user = await db('users').where('id', decoded.id).first();
        if (!user) {
            return res.status(401).json({ message: 'User does not exist.' });
        }
        const userToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ 
            message: `Successfully logged in as ${user.email}`, 
            token: userToken, 
            isAdmin: false 
        });
    } catch (error) {
        console.error("IMPERSONATION LOGIN ERROR:", error);
        res.status(500).json({ message: 'Invalid or expired token.' });
    }
};