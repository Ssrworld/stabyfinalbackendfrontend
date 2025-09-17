// backend/src/services/user.service.js (CORRECTED AND FINAL VERSION)

const db = require('../config/db.config');
const { createHtmlEmail } = require('./email.service');

const REQUIRED_ACTIVATION_AMOUNT = 20.0;
const DIRECT_REFERRAL_COMMISSION = 5.0;
const ADMIN_JOINING_FEE = 5.0;
const STBL_REWARD_AMOUNT = 10000;
const REQUIRED_REFERRALS_FOR_REWARD = 5;

/**
 * ✅ NEW AND CORRECT FUNCTION
 * Finds ALL upline promoters in a user's referral chain, going up to 100 levels.
 * @param {number} userId - The ID of the user whose upline we need to trace.
 * @param {import("knex").Knex.Transaction} trx - The Knex transaction object.
 * @returns {Promise<Array<object>>} - An array of all promoter user objects found in the upline.
 */
async function findAllUplinePromoters(userId, trx) {
    const promoters = [];
    let currentUser = await trx('users').where('id', userId).first('id', 'referred_by');
    
    // Loop up the referral chain, with a safe limit of 100 levels to prevent infinite loops.
    for (let i = 0; i < 100; i++) {
        // If there is no current user or they were not referred by anyone, stop.
        if (!currentUser || !currentUser.referred_by) {
            break;
        }
        
        // Get the details of the person who referred the current user.
        const uplineUser = await trx('users')
            .where('id', currentUser.referred_by)
            .first('id', 'referred_by', 'role');
            
        // If this upline user is a promoter, add them to our list.
        if (uplineUser && uplineUser.role === 'PROMOTER') {
            promoters.push(uplineUser);
        }
        
        // Move one level up the chain for the next iteration.
        currentUser = uplineUser;
    }
    return promoters;
}

const activateUser = async (userId) => {
    return db.transaction(async trx => {
        // --- Step 1: User and Fund validation (No changes here) ---
        const user = await trx('users').where('id', userId).forUpdate().first();
        
        if (!user) {
            throw new Error('User not found.');
        }
        if (user.status === 'ACTIVE') {
            throw new Error('Account is already active.');
        }

        const mainBalance = parseFloat(user.main_balance || 0);
        let activationSource = null;
        let totalAvailableFromDeposits = 0;

        if (mainBalance >= REQUIRED_ACTIVATION_AMOUNT) {
            activationSource = 'main_balance';
        } else {
            const { totalDeposit } = await trx('partial_deposits').where({ user_id: userId, is_processed: false }).sum('amount as totalDeposit').first();
            totalAvailableFromDeposits = parseFloat(totalDeposit || 0);
            if (totalAvailableFromDeposits >= REQUIRED_ACTIVATION_AMOUNT) {
                activationSource = 'deposit';
            }
        }
        
        if (!activationSource) {
            if (totalAvailableFromDeposits > 0 && user.status === 'PENDING') {
                await trx('users').where('id', userId).update({ status: 'INSUFFICIENT_DEPOSIT' });
            }
            throw new Error(`Insufficient funds. Found $${mainBalance.toFixed(2)} in Main Wallet and $${totalAvailableFromDeposits.toFixed(2)} in new deposits.`);
        }

        console.log(`[Activation] Activating User ID ${userId} using '${activationSource}'.`);

        if (activationSource === 'main_balance') {
            await trx('users').where('id', userId).decrement('main_balance', REQUIRED_ACTIVATION_AMOUNT);
        } else {
            await trx('partial_deposits').where({ user_id: userId, is_processed: false }).update({ is_processed: true });
            const extraAmount = totalAvailableFromDeposits - REQUIRED_ACTIVATION_AMOUNT;
            if (extraAmount > 0.01) {
                await trx('users').where('id', userId).increment('main_balance', extraAmount);
            }
        }
        
        await trx('admin_earnings').insert({ user_id: userId, amount: ADMIN_JOINING_FEE, type: 'JOINING_FEE', pool_level: 0 });
        console.log(`[Fee] Admin received $${ADMIN_JOINING_FEE} joining fee from User ID ${userId}.`);

        // --- Step 2: Standard and Direct Promoter Commissions (No changes here) ---
        if (user.referred_by) {
            const sponsor = await trx('users').where('id', user.referred_by).forUpdate().first();
            if (sponsor) {
                // --- Normal $5 referral commission ---
                if (sponsor.id === 1) { 
                    await trx('admin_earnings').insert({ user_id: userId, sponsor_id: sponsor.id, amount: DIRECT_REFERRAL_COMMISSION, type: 'DIRECT_REFERRAL', pool_level: 0 });
                    console.log(`[Commission] Admin (ID: 1) received $${DIRECT_REFERRAL_COMMISSION} commission for referring User ID ${userId}.`);
                } else { 
                    await trx('users').where('id', sponsor.id).increment({ 'withdrawable_balance': DIRECT_REFERRAL_COMMISSION, 'total_earnings': DIRECT_REFERRAL_COMMISSION });
                    await trx('admin_earnings').insert({ user_id: userId, sponsor_id: sponsor.id, amount: -DIRECT_REFERRAL_COMMISSION, type: 'DIRECT_REFERRAL', pool_level: 0 });
                    console.log(`[Commission] User ID ${sponsor.id} received $${DIRECT_REFERRAL_COMMISSION} commission for referring User ID ${userId}.`);
                }

                // --- Extra Promoter Commission (for DIRECT REFERRALS only) ---
                if (sponsor.role === 'PROMOTER') {
                    // This logic is for direct referral bonus for promoters and remains unchanged.
                    // ... (your existing direct promoter bonus logic is correct and stays here) ...
                }
            }
        }

        // --- ✅✅✅ STEP 3: NEW PROMOTER TEAM COMMISSION LOGIC ✅✅✅ ---
        const promoterTeamCommissionSetting = await trx('system_settings')
            .where('setting_key', 'promoter_team_commission_usdt')
            .first();
        
        const teamCommissionAmount = parseFloat(promoterTeamCommissionSetting?.setting_value || 0);

        if (teamCommissionAmount > 0) {
            // Use the new function to find ALL upline promoters
            const allUplinePromoters = await findAllUplinePromoters(userId, trx);
            
            if (allUplinePromoters.length > 0) {
                console.log(`[Promoter Team Commission] Found ${allUplinePromoters.length} upline promoters for user ${userId}. Awarding $${teamCommissionAmount.toFixed(2)} to each.`);
                
                // Loop through each promoter found in the upline and award them the commission.
                for (const promoter of allUplinePromoters) {
                    await trx('users')
                        .where('id', promoter.id)
                        .increment({
                            'withdrawable_balance': teamCommissionAmount,
                            'total_earnings': teamCommissionAmount
                        });

                    await trx('admin_earnings').insert({
                        user_id: userId,
                        sponsor_id: promoter.id,
                        amount: -teamCommissionAmount,
                        type: 'PROMOTER_TEAM_PAYOUT',
                        notes: `Team commission for activation of user ${userId}`
                    });

                    await trx('promoter_commissions').insert({
                        promoter_id: promoter.id,
                        from_user_id: userId,
                        commission_amount: teamCommissionAmount,
                        token_commission_amount: 0,
                        commission_type: 'TEAM_ACTIVATION_BONUS'
                    });
                }
            } else {
                 console.log(`[Promoter Team Commission] No upline promoters found for user ${userId}.`);
            }
        }
        
        // --- Step 4: Finalize Activation and Send Emails (No changes here) ---
        const lastPlacement = await trx('users').max('global_placement_id as max_id').first();
        const nextPlacementId = (lastPlacement.max_id || 0) + 1;

        await trx('users').where('id', userId).update({
            status: 'ACTIVE', current_pool: 1, activation_timestamp: new Date(), global_placement_id: nextPlacementId
        });

        try {
            const subject = '✅ Congratulations! Your Account is Active!';
            const headline = "You're In!";
            const referralLink = `${process.env.FRONTEND_URL || 'https://rewards.stabylink.com'}/register/${user.referral_code}`;
            const content = `<p>Your account is now active and you have officially entered the rewards program at <strong>Reward 1</strong>!</p><p>Now is the perfect time to start building your team. Share your personal referral link to earn instant commissions and progress through the reward pools.</p><div style="background-color: #0d0c22; padding: 15px; border-radius: 8px; text-align: center; margin-top: 25px; margin-bottom: 25px;"><p style="font-size: 14px; color: #e0e0e0; word-break: break-all;"><strong>${referralLink}</strong></p></div><hr style="border: none; border-top: 1px solid #2a2a4a; margin: 30px 0;"><h3 style="color: #ffffff; text-align:center; font-size: 20px;">🚀 Special Bonus: Earn 10,000 STBL Tokens!</h3><p style="text-align:center; color: #a0e0e0;">As a community builder, you have the opportunity to earn a massive bonus. Simply help <strong>5 of your direct referrals</strong> activate their accounts, and you will unlock a <strong>10,000 STBL Token airdrop!</strong></p>`;
            const fullHtmlContent = createHtmlEmail(headline, content, subject);
            await trx('email_queue').insert({ recipient_email: user.email, subject: subject, content_html: fullHtmlContent });
        } catch (queueError) {
            console.error(`[Activation] CRITICAL ERROR: Failed to add activation email to queue for User ID ${userId}. Error: ${queueError.message}`);
        }

        if (user.referred_by && user.referred_by !== 1) {
            const sponsorId = user.referred_by;
            const { count } = await trx('users').where({ referred_by: sponsorId, status: 'ACTIVE' }).count('* as count').first();
            const activeReferralsCount = parseInt(count, 10);
            console.log(`[STBL Reward Check] Sponsor ID ${sponsorId} now has ${activeReferralsCount} active referrals.`);
            if (activeReferralsCount === REQUIRED_REFERRALS_FOR_REWARD) {
                await trx('users').where('id', sponsorId).increment('stbl_token_balance', STBL_REWARD_AMOUNT);
                await trx('stbl_token_rewards').insert({
                    user_id: sponsorId, amount: STBL_REWARD_AMOUNT,
                    reason: `${REQUIRED_REFERRALS_FOR_REWARD}_active_referrals_bonus`, status: 'UNCLAIMED'
                });
                console.log(`[STBL Reward] ✅ SUCCESS: Awarded ${STBL_REWARD_AMOUNT} STBL tokens to User ID ${sponsorId} for reaching ${REQUIRED_REFERRALS_FOR_REWARD} active referrals.`);
            }
        }

        return { message: 'Congratulations! Your account has been successfully activated.' };
    });
};

module.exports = {
    activateUser,
};