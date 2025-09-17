// backend/src/scripts/recoveryService.js (FINAL & UPDATED)

const path = require('path');
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });
}

const db = require('../config/db.config');
const { activateUser } = require('../services/user.service'); // activateUser सर्विस को इम्पोर्ट करें

const REQUIRED_ACTIVATION_AMOUNT = 20.0;

/**
 * यह स्क्रिप्ट उन उपयोगकर्ताओं की जाँच करती है जिन्होंने पर्याप्त फंड जमा कर दिए हैं
 * और उन्हें सक्रिय करने का प्रयास करती है।
 */
async function checkAndActivateUsers() {
    // console.log('[AccountActivator] 🕵️  Checking for users ready for activation...');
    
    try {
        const usersToPotentiallyActivate = await db('users')
            .whereIn('status', ['PENDING', 'INSUFFICIENT_DEPOSIT'])
            .select('id', 'status');

        if (usersToPotentiallyActivate.length === 0) {
            // console.log('[AccountActivator] No pending users to check. Cycle finished.');
            return;
        }
        
        for (const user of usersToPotentiallyActivate) {
            try {
                const { totalDeposit } = await db('partial_deposits')
                    .where({ user_id: user.id, is_processed: false })
                    .sum('amount as totalDeposit')
                    .first();

                const totalDepositedAmount = parseFloat(totalDeposit || 0);

                // यदि कुल जमा राशि सक्रियण के लिए पर्याप्त है
                if (totalDepositedAmount >= REQUIRED_ACTIVATION_AMOUNT) {
                    console.log(`[AccountActivator] User ID ${user.id} has sufficient funds ($${totalDepositedAmount.toFixed(2)}). Attempting activation...`);
                    // सक्रियण प्रक्रिया शुरू करें
                    await activateUser(user.id);
                    console.log(`[AccountActivator] ✅ Successfully activated User ID ${user.id}.`);
                } 
                // यदि कुछ फंड जमा हैं लेकिन पर्याप्त नहीं हैं, तो स्थिति अपडेट करें
                else if (totalDepositedAmount > 0 && user.status === 'PENDING') {
                    await db('users').where('id', user.id).update({ status: 'INSUFFICIENT_DEPOSIT' });
                    console.log(`[AccountActivator] User ID ${user.id} status updated to INSUFFICIENT_DEPOSIT.`);
                }
            } catch (error) {
                console.error(`[AccountActivator] ❌ Error processing activation for User ID ${user.id}:`, error.message);
                // हम यहाँ त्रुटि नहीं फेंकते ताकि लूप अन्य उपयोगकर्ताओं के लिए जारी रहे
            }
        }

    } catch (error) {
        console.error("🔴 [AccountActivator] CRITICAL ERROR during run:", error.message);
        throw error; // त्रुटि को मास्टर रनर तक पहुँचाएँ
    }
}

module.exports = { checkAndActivateUsers };