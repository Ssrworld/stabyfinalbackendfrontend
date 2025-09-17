// backend/src/services/email.service.js (FINAL AND CORRECTED - LOGO IN SIGNATURE)

const db = require('../config/db.config');

const BREVO_API_KEY = process.env.BREVO_API_KEY;
if (!BREVO_API_KEY) {
    console.warn("[Email Service] BREVO_API_KEY is not set. Email functionality will be disabled.");
}

const logoUrl = 'https://res.cloudinary.com/dhaci8gpb/image/upload/v1757791134/svgviewer-png-output_1_oiu4rz.png';

const createBrandedEmailTemplate = (headline, contentHtml, subject) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
            body { margin: 0; padding: 0; background-color: #0d0c22; font-family: Arial, sans-serif; }
            table { border-collapse: collapse; }
            a { color: #57a6ff; text-decoration: none; }
        </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0d0c22; font-family: Arial, sans-serif;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto;">
            <!-- Header Logo -->
            <tr>
                <td align="center" style="padding: 40px 0;">
                    <img src="${logoUrl}" alt="Stabylink Logo" width="180" style="display: block;">
                </td>
            </tr>
            <!-- Main Content Card -->
            <tr>
                <td style="padding: 10px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1a1a2e; border-radius: 12px; padding: 30px 25px;">
                        <!-- Headline -->
                        <tr>
                            <td align="center" style="color: #ffffff; font-size: 28px; font-weight: bold; padding-bottom: 20px; font-family: Arial, sans-serif;">
                                ${headline}
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="color: #cccccc; font-size: 16px; line-height: 1.7; font-family: Arial, sans-serif;">
                                ${contentHtml}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <!-- Footer / Signature -->
            <tr>
                <td align="center" style="padding: 40px 0 20px 0;">
                    
                    <!-- ✅✅✅ यही सही समाधान है: टेक्स्ट की जगह लोगो इमेज ✅✅✅ -->
                    <img src="${logoUrl}" alt="Stabylink Logo" width="120" style="display: block; margin: 0 auto 10px auto;">
                    
                    <p style="margin: 5px 0 15px 0; color: #a0a0e0; font-size: 12px; font-family: Arial, sans-serif;">Automated Rewards Protocol</p>
                    <table border="0" cellpadding="0" cellspacing="0">
                        <tr>
                            <td align="center" style="padding: 0 10px;">
                                <a href="https://rewards.stabylink.com" style="color: #57a6ff; text-decoration: none; font-size: 12px; font-family: Arial, sans-serif;">Rewards Portal</a>
                            </td>
                            <td style="color: #a0a0e0; font-size: 12px;">|</td>
                            <td align="center" style="padding: 0 10px;">
                                <a href="https://stabylink.com" style="color: #57a6ff; text-decoration: none; font-size: 12px; font-family: Arial, sans-serif;">Web3 Portal</a>
                            </td>
                        </tr>
                    </table>
                    <p style="margin-top: 20px; color: #777777; font-size: 11px; font-family: Arial, sans-serif;">&copy; ${new Date().getFullYear()} Stabylink. All rights reserved.</p>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
};


// --- बाकी के सभी फ़ंक्शंस अब स्वचालित रूप से इस सही टेम्प्लेट का उपयोग करेंगे ---
// --- इनमें कोई बदलाव करने की आवश्यकता नहीं है ---

exports.createHtmlEmail = createBrandedEmailTemplate;

const sendMail = async (to, subject, html) => {
    if (!BREVO_API_KEY) { console.error(`[Email] FAILED to send '${subject}' to ${to}: BREVO_API_KEY is missing.`); throw new Error("Email service is not configured."); }
    const payload = { sender: { name: 'Stabylink Support', email: process.env.EMAIL_FROM || 'support@stabylink.com' }, to: [{ email: to }], subject: subject, htmlContent: html };
    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', { method: 'POST', headers: { 'accept': 'application/json', 'api-key': BREVO_API_KEY, 'content-type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) { const errorBody = await response.json(); throw new Error(`Brevo API Error: ${response.status} - ${JSON.stringify(errorBody)}`); }
        console.log(`[Email API] Sent '${subject}' to ${to} via Brevo API.`);
    } catch (error) { console.error(`[Email API] FAILED to send '${subject}' to ${to}:`, error.message); throw error; }
};
exports.sendMail = sendMail;

const trySendEmailOrQueue = async (to, subject, html, attachments = [], trx) => {
    try { await sendMail(to, subject, html); } catch (error) {
        console.warn(`[Email Service] API send failed for ${to}. Queuing for later. Error: ${error.message}`);
        const queryBuilder = trx || db;
        try { await queryBuilder('email_queue').insert({ recipient_email: to, subject: subject, content_html: html, status: 'PENDING', last_error: error.message.substring(0, 1000) }); } catch (queueError) { console.error(`[Email Service] CRITICAL: Failed to even queue the email for ${to}.`, queueError); }
    }
};
exports.trySendEmailOrQueue = trySendEmailOrQueue;

exports.sendActivationSuccessEmail = async (to, referralCode, trx) => {
    const subject = '✅ Congratulations! Your Account is Active!';
    const headline = "You're In!";
    const referralLink = `${process.env.FRONTEND_URL || 'https://rewards.stabylink.com'}/register/${referralCode}`;
    const content = `<p>Your account is now active and you have officially entered the rewards program at <strong>Reward 1</strong>!</p><p>Now is the perfect time to start building your team. Share your personal referral link to earn instant commissions and progress through the reward pools.</p><div style="background-color: #0d0c22; padding: 15px; border-radius: 8px; text-align: center; margin: 25px 0;"><p style="font-size: 14px; color: #e0e0e0; word-break: break-all;"><a href="${referralLink}" style="color:#57a6ff;"><strong>${referralLink}</strong></a></p></div><hr style="border: none; border-top: 1px solid #2a2a4a; margin: 30px 0;"><h3 style="color: #ffffff; text-align:center; font-size: 20px;">🚀 Special Bonus: Earn 10,000 STBL Tokens!</h3><p style="text-align:center; color: #a0a0e0;">Simply help <strong>5 of your direct referrals</strong> activate their accounts, and you will unlock a <strong>10,000 STBL Token airdrop!</strong></p>`;
    const html = createBrandedEmailTemplate(headline, content, subject);
    await trySendEmailOrQueue(to, subject, html, [], trx);
};

exports.sendRewardUpgradeEmail = async (to, newReward, rewardAmount, trx) => {
    const subject = `🎉 Congratulations! You've Unlocked Reward ${newReward}!`;
    const headline = 'Onwards and Upwards!';
    const content = `<p>Amazing work! You have successfully unlocked <strong>Reward ${newReward}</strong>.</p><p style="font-size: 18px; text-align: center; margin: 25px 0;">A reward of <strong style="color: #4dff88; font-size:22px;">$${rewardAmount} USDT</strong> has been added to your withdrawable balance!</p>`;
    const html = createBrandedEmailTemplate(headline, content, subject);
    await trySendEmailOrQueue(to, subject, html, [], trx);
};

exports.sendWithdrawalRequestEmail = async (to, amount, trx) => {
    const subject = 'ℹ️ Your Withdrawal Request has been Received';
    const headline = 'Request Received';
    const content = `<p>We have received your withdrawal request for <strong>$${amount} USDT</strong>. It is now pending and will be processed shortly. You will receive another email once the transaction is complete.</p>`;
    const html = createBrandedEmailTemplate(headline, content, subject);
    await trySendEmailOrQueue(to, subject, html, [], trx);
};

exports.sendWithdrawalSuccessEmail = async (to, amount, finalAmount, fee, txHash, trx) => {
    const subject = '✅ Your Withdrawal has been Sent!';
    const headline = 'Withdrawal Processed!';
    const content = `<p>Your withdrawal for <strong>$${amount} USDT</strong> has been successfully processed. After a 10% service fee, you will receive <strong>$${finalAmount} USDT</strong>.</p><p>You can view the transaction on the blockchain here: <a href="https://bscscan.com/tx/${txHash}" style="color:#57a6ff;">View on BscScan</a></p>`;
    const html = createBrandedEmailTemplate(headline, content, subject);
    await trySendEmailOrQueue(to, subject, html, [], trx);
};

exports.sendWithdrawalFailedEmail = async (to, amount, trx) => {
    const subject = '⚠️ Action Required: Your Withdrawal Failed';
    const headline = 'Withdrawal Request Failed';
    const content = `<p>Unfortunately, your withdrawal request for <strong>$${amount} USDT</strong> could not be processed. The full amount has been returned to your balance. Please try again later.</p>`;
    const html = createBrandedEmailTemplate(headline, content, subject);
    await trySendEmailOrQueue(to, subject, html, [], trx);
};

exports.sendOtpEmail = async (to, otp) => {
    const subject = 'Your Password Reset OTP';
    const headline = 'Password Reset Request';
    const content = `<p>Your One-Time Password (OTP) is:</p><p style="font-size: 28px; font-weight: bold; text-align: center; color: #ffffff; background-color: #0d0c22; padding: 10px; border-radius: 8px; letter-spacing: 4px;">${otp}</p><p>This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>`;
    const html = createBrandedEmailTemplate(headline, content, subject);
    await sendMail(to, subject, html);
};