// backend/src/scripts/masterRunner.js (FINAL UPDATED CODE WITH LOCKING)

const path = require('path');

// .env फ़ाइल को केवल तभी लोड करें जब NODE_ENV 'production' न हो
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });
}

const cron = require('node-cron');
const { recordHealthCheck } = require('../services/health.service');
// ✅ नई लॉकिंग सर्विस को इम्पोर्ट करें
const { acquireLock, releaseLock } = require('../services/lock.service');

// --- आवश्यक स्क्रिप्ट्स इम्पोर्ट करें ---
const { checkAndSweepDeposits } = require('./blockchainListener');
const { checkAndActivateUsers } = require('./recoveryService');
const { processQueue } = require('../services/poolEngine.service');
const { processPayouts } = require('./payoutProcessor');
const { processStblPayouts } = require('./stblPayoutProcessor');
const { processEmailQueue } = require('./emailProcessor');

/**
 * ✅ runAndMonitor फंक्शन का नया और बेहतर वर्जन (लॉकिंग के साथ)
 * यह पहले लॉक हासिल करने की कोशिश करता है। अगर लॉक मिल जाता है, तभी काम करता है।
 * काम खत्म होने के बाद, यह हमेशा लॉक को हटा देता है, चाहे काम सफल हो या फेल।
 */
const runAndMonitor = async (serviceName, task) => {
    const hasLock = await acquireLock(serviceName);

    // अगर लॉक नहीं मिला, तो चुपचाप बाहर निकल जाएँ।
    if (!hasLock) {
        return;
    }

    // try...finally ब्लॉक यह सुनिश्चित करता है कि लॉक हमेशा हटाया जाएगा।
    try {
        console.log(`\n[${new Date().toLocaleTimeString()}] 🚀 Running ${serviceName}...`);
        await task();
        await recordHealthCheck(serviceName, 'OK');
    } catch (err) {
        console.error(`[Cron Error] ${serviceName} failed:`, err.message);
        await recordHealthCheck(serviceName, 'ERROR', err.message);
    } finally {
        // ✅ सबसे ज़रूरी: काम खत्म होने के बाद लॉक को हमेशा हटा दें।
        await releaseLock(serviceName);
    }
};

/**
 * मुख्य फ़ंक्शन जो सभी स्वचालित कार्यों को शेड्यूल और शुरू करता है।
 */
function main() {
    console.log('==============================================');
    // ✅ वर्ज़न नंबर अपडेट किया गया ताकि पता चले कि नया कोड चल रहा है
    console.log('🚀 STARTING STABYLINK AUTOMATION ENGINE V4.1 (with Job Locking) 🚀');
    console.log(`🕒 Current Time: ${new Date().toLocaleString()}`);
    console.log('==============================================');
    
    // ✅ SERVICE_NAMES को परिभाषित करें ताकि टाइपो की कोई गलती न हो
    const SERVICES = {
        DEPOSIT_SWEEP: 'DEPOSIT_AND_SWEEP',
        ACTIVATOR: 'ACCOUNT_ACTIVATOR',
        POOL_ENGINE: 'POOL_ENGINE',
        PAYOUT: 'PAYOUT_PROCESSOR',
        STBL_PAYOUT: 'STBL_PAYOUT_PROCESSOR',
        EMAIL: 'EMAIL_PROCESSOR',
    };

    // 1. डिपॉजिट चेकर और फंड स्वीपर (हर मिनट)
    cron.schedule('* * * * *', () => runAndMonitor(SERVICES.DEPOSIT_SWEEP, checkAndSweepDeposits));
    console.log('🕒 [Scheduler] Deposit Checker & Sweeper scheduled for EVERY MINUTE.');

    // 2. खाता सक्रियकर्ता (हर 2 मिनट में)
    cron.schedule('*/2 * * * *', () => runAndMonitor(SERVICES.ACTIVATOR, checkAndActivateUsers));
    console.log('🕒 [Scheduler] Account Activator scheduled for EVERY 2 MINUTES.');
    
    // 3. पूल इंजन (हर मिनट)
    cron.schedule('* * * * *', () => runAndMonitor(SERVICES.POOL_ENGINE, processQueue));
    console.log('🕒 [Scheduler] Pool Engine scheduled for EVERY MINUTE.');

    // 4. USDT पेआउट प्रोसेसर (हर 5 मिनट में)
    cron.schedule('*/5 * * * *', () => runAndMonitor(SERVICES.PAYOUT, processPayouts));
    console.log('🕒 [Scheduler] Payout Processor scheduled for EVERY 5 MINUTES.');
    
    // 5. STBL टोकन पेआउट प्रोसेसर (हर 10 मिनट में)
    cron.schedule('*/10 * * * *', () => runAndMonitor(SERVICES.STBL_PAYOUT, processStblPayouts));
    console.log('🕒 [Scheduler] STBL Token Payout Processor scheduled for EVERY 10 MINUTES.');
    
    // 6. ईमेल क्यू प्रोसेसर (हर 2 मिनट में)
    cron.schedule('*/2 * * * *', () => runAndMonitor(SERVICES.EMAIL, processEmailQueue));
    console.log('🕒 [Scheduler] Email Queue Processor scheduled for EVERY 2 MINUTES.');
    
    console.log('\n🔥 Automation Engine is running. All systems are go.');
}

main();