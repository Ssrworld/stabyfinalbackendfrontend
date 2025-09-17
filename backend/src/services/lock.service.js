// backend/src/services/lock.service.js (NEW FILE)

const db = require('../config/db.config');
const LOCK_TIMEOUT_MINUTES = 15; // अगर कोई जॉब 15 मिनट से ज़्यादा अटकी रहे, तो लॉक अपने आप हट जाएगा।

/**
 * किसी जॉब के लिए लॉक हासिल करने की कोशिश करता है।
 * @param {string} jobName - लॉक किए जाने वाले जॉब का यूनिक नाम।
 * @returns {Promise<boolean>} - अगर लॉक मिल गया तो true, वरना false।
 */
const acquireLock = async (jobName) => {
    try {
        // पुराने, अटके हुए लॉक्स को हटाएँ।
        const timeout = new Date(Date.now() - LOCK_TIMEOUT_MINUTES * 60 * 1000);
        await db('job_locks').where('locked_at', '<', timeout).del();
        
        // नया लॉक डालने की कोशिश करें।
        await db('job_locks').insert({ job_name: jobName });
        
        // अगर कोई एरर नहीं आया, इसका मतलब है कि लॉक मिल गया।
        console.log(`[LockService] 🔒 Lock acquired for ${jobName}.`);
        return true;
    } catch (error) {
        // अगर 'duplicate key' का एरर आता है, इसका मतलब है कि जॉब पहले से चल रही है।
        if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') {
            console.log(`[LockService] ❕ Job ${jobName} is already running. Skipping this run.`);
            return false;
        }
        // किसी और एरर के लिए, उसे लॉग करें।
        console.error(`[LockService] Error acquiring lock for ${jobName}:`, error);
        return false;
    }
};

/**
 * किसी जॉब के लिए लॉक को हटाता है।
 * @param {string} jobName - जिस जॉब का लॉक हटाना है उसका नाम।
 */
const releaseLock = async (jobName) => {
    try {
        await db('job_locks').where({ job_name: jobName }).del();
        console.log(`[LockService] 🟢 Lock released for ${jobName}.`);
    } catch (error) {
        console.error(`[LockService] Error releasing lock for ${jobName}:`, error);
    }
};

module.exports = {
    acquireLock,
    releaseLock,
};