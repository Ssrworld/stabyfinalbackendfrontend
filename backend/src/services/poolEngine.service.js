// backend/src/services/poolEngine.service.js (FIXED FOR EMAIL QUEUE)

const db = require('../config/db.config');
// --- ✅ समाधान: sendRewardUpgradeEmail की जगह createHtmlEmail को इम्पोर्ट करें ---
const { createHtmlEmail } = require('./email.service');

// System rules (unchanged)
const POOL_RULES = [
    { pool: 1, payout: 10 }, { pool: 2, payout: 20 },
    { pool: 3, payout: 40 }, { pool: 4, payout: 80 },
    { pool: 5, payout: 160 }, { pool: 6, payout: 320 },
    { pool: 7, payout: 640 }, { pool: 8, payout: 1280 },
    { pool: 9, payout: 2560 }, { pool: 10, payout: 15360 },
];
const POOL_SIZE = 3;

// processPoolCompletion function (updated)
async function processPoolCompletion(userId, completedPoolNumber, trx) {
    const rule = POOL_RULES.find(p => p.pool === completedPoolNumber);
    if (!rule) throw new Error(`Invalid pool number: ${completedPoolNumber}`);
    
    const userPayout = rule.payout;
    const nextPool = completedPoolNumber < 10 ? completedPoolNumber + 1 : 0;

    await trx('users').where('id', userId).increment({
        withdrawable_balance: userPayout,
        total_earnings: userPayout
    });
    
    await trx('admin_earnings').insert({
        user_id: userId,
        amount: -userPayout,
        type: 'POOL_PAYOUT',
        pool_level: completedPoolNumber
    });
    
    await trx('users').where('id', userId).update({
        current_pool: nextPool,
        sponsor_id: null // Reset for the next pool
    });
    
    console.log(`[PoolEngine] User ${userId} completed Pool ${completedPoolNumber}. Payout: $${userPayout}, Next Pool: ${nextPool}`);

    const user = await trx('users').where('id', userId).first('email');
    if (user && nextPool > 0) {
        // --- ✅ समाधान: ईमेल को सीधे भेजने के बजाय क्यू में डालें ---
        try {
            const subject = `🎉 Congratulations! You've Unlocked Reward ${nextPool}!`;
            const headline = 'Onwards and Upwards!';
            const content = `
                <p>Amazing work! Your team's progress has paid off.</p>
                <p>You have successfully completed Reward ${completedPoolNumber} and have automatically unlocked <strong>Reward ${nextPool}</strong>.</p>
                <p style="font-size: 18px; text-align: center; margin: 25px 0;">A reward of <strong style="color: #4dff88; font-size:22px;">$${userPayout} USDT</strong> has been added to your withdrawable balance!</p>
                <p>Keep up the great momentum!</p>
            `;
            const fullHtmlContent = createHtmlEmail(headline, content, subject);

            await trx('email_queue').insert({
                recipient_email: user.email,
                subject: subject,
                content_html: fullHtmlContent
            });
        } catch (queueError) {
            console.error(`[PoolEngine] CRITICAL WARNING: Failed to queue reward upgrade email for User ID ${userId}. Error: ${queueError.message}`);
        }
    }
}

// findNextAvailableSponsorForPool1 function (unchanged)
async function findNextAvailableSponsorForPool1(trx) {
    const potentialSponsors = await trx('users')
        .where('current_pool', 1)
        .orderBy('activation_timestamp', 'asc')
        .select('id');

    if (potentialSponsors.length === 0) {
        const systemUser = await trx('users').where('id', 2).first('id');
        if (!systemUser) return null;
        const childCount = await trx('users').where('original_sponsor_id', 2).count('* as count').first();
        if (parseInt(childCount.count, 10) < POOL_SIZE) return 2;
        return null;
    }
    
    for (const sponsor of potentialSponsors) {
        const childCountResult = await trx('users').where('original_sponsor_id', sponsor.id).count('* as count').first();
        if (parseInt(childCountResult.count, 10) < POOL_SIZE) return sponsor.id;
    }

    return null;
}

// processQueue function (unchanged)
async function processQueue() {
    try {
        await db.transaction(async trx => {
            // PART 1: Pool 1 Placement (First-Come, First-Served)
            const unplacedPool1Members = await trx('users')
                .where({ status: 'ACTIVE', original_sponsor_id: null, current_pool: 1 })
                .whereNotIn('id', [1, 2])
                .orderBy('activation_timestamp', 'asc')
                .select('id');

            for (const member of unplacedPool1Members) {
                const sponsorId = await findNextAvailableSponsorForPool1(trx);
                if (sponsorId) {
                    await trx('users').where('id', member.id).update({ original_sponsor_id: sponsorId });
                    
                    const { count } = await trx('users').where({ original_sponsor_id: sponsorId }).count('* as count').first();
                    if (parseInt(count, 10) >= POOL_SIZE) {
                        const sponsor = await trx('users').where('id', sponsorId).first();
                        if (sponsor && sponsor.current_pool === 1) {
                            await processPoolCompletion(sponsorId, 1, trx);
                        }
                    }
                } else {
                    break;
                }
            }
            
            // PART 2: Higher Pools Placement (Follow Me)
            const unplacedHigherPoolMembers = await trx('users')
                .where('status', 'ACTIVE')
                .where('current_pool', '>', 1)
                .whereNull('sponsor_id')
                .whereNot('id', 1)
                .orderBy('activation_timestamp', 'asc')
                .select('id', 'original_sponsor_id', 'current_pool');

            for (const member of unplacedHigherPoolMembers) {
                if (!member.original_sponsor_id) continue;
                const originalSponsor = await trx('users').where('id', member.original_sponsor_id).first();
                if (originalSponsor && originalSponsor.current_pool >= member.current_pool) {
                    const { count } = await trx('users').where({ sponsor_id: originalSponsor.id, current_pool: member.current_pool }).count('* as count').first();
                    if (parseInt(count, 10) < POOL_SIZE) {
                        await trx('users').where('id', member.id).update({ sponsor_id: originalSponsor.id });
                    }
                }
            }

            // PART 3: Check for completed higher pools (Pools 2-9)
            const membersToCheckForCompletion = await trx('users')
                .where('status', 'ACTIVE')
                .where('current_pool', '>', 1)
                .where('current_pool', '<', 10)
                .whereNot('id', 1)
                .select('id', 'current_pool');
            
            for (const member of membersToCheckForCompletion) {
                const { count } = await trx('users')
                    .where({
                        sponsor_id: member.id,
                        current_pool: member.current_pool
                    })
                    .count('* as count')
                    .first();

                if (parseInt(count, 10) >= POOL_SIZE) {
                    console.log(`[PoolEngine] Found completed Pool ${member.current_pool} for User ID ${member.id}. Processing...`);
                    await processPoolCompletion(member.id, member.current_pool, trx);
                }
            }
        });
    } catch (error) {
        console.error('[PoolEngine] CRITICAL ERROR during transaction:', error.message, error.stack);
        throw error;
    }
}

module.exports = { 
    processQueue,
    findNextAvailableSponsorForPool1 
};
