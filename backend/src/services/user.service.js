// backend/src/services/user.service.js (FULL FILE WITH WITHDRAWABLE BALANCE FIX)

const db = require('../config/db.config');
const { createHtmlEmail } = require('./email.service');

const REQUIRED_ACTIVATION_AMOUNT = 20.0;
const DIRECT_REFERRAL_COMMISSION = 5.0;
const ADMIN_JOINING_FEE = 5.0;
const STBL_REWARD_AMOUNT = 10000;
const REQUIRED_REFERRALS_FOR_REWARD = 5;

/**
 * Finds the closest upline promoter for a given user.
 * @param {number} userId - The ID of the user whose upline we need to check.
 * @param {import("knex").Knex.Transaction} trx - The Knex transaction object.
 * @returns {Promise<object|null>} - The promoter user object or null if not found.
 */
async function findUplinePromoter(userId, trx) {
    let currentUser = await trx('users').where('id', userId).first('id', 'referred_by');
    
    for (let i = 0; i < 100; i++) {
        if (!currentUser || !currentUser.referred_by) {
            return null;
        }
        const uplineUser = await trx('users').where('id', currentUser.referred_by).first('id', 'referred_by', 'role');
        if (uplineUser && uplineUser.role === 'PROMOTER') {
            return uplineUser;
        }
        currentUser = uplineUser;
    }
    return null;
}

const activateUser = async (userId) => {
    return db.transaction(async trx => {
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

                // --- Extra Promoter Commission (for DIRECT REFERRALS) ---
                if (sponsor.role === 'PROMOTER') {
                    const promoterUsdtSetting = await trx('system_settings').where('setting_key', 'promoter_referral_commission_usdt').first();
                    const usdtCommissionAmount = parseFloat(promoterUsdtSetting?.setting_value || 0);
                    
                    if (usdtCommissionAmount > 0) {
                        // ✅ FIX: Also increment withdrawable_balance
                        await trx('users').where('id', sponsor.id).increment({ 
                            'withdrawable_balance': usdtCommissionAmount, 
                            'total_earnings': usdtCommissionAmount 
                        });
                        await trx('admin_earnings').insert({
                            user_id: userId, sponsor_id: sponsor.id, amount: -usdtCommissionAmount,
                            type: 'PROMOTER_PAYOUT', notes: `Promoter USDT bonus for referral of user ${userId}`
                        });
                    }

                    const { count } = await trx('users').where({ referred_by: sponsor.id, status: 'ACTIVE' }).count('* as count').first();
                    const activeReferralsCount = parseInt(count, 10) + 1;
                    const settings = await trx('system_settings').select('setting_key', 'setting_value');
                    const milestonesConfig = JSON.parse(settings.find(s => s.setting_key === 'promoter_milestones_config')?.setting_value || '{}');
                    
                    const achievedMilestones = JSON.parse(sponsor.achieved_promoter_milestones || '[]');
                    let awardedTokenAmount = 0;
                    for (const milestone of Object.keys(milestonesConfig).sort((a, b) => parseInt(a) - parseInt(b))) {
                        const milestoneCount = parseInt(milestone, 10);
                        if (activeReferralsCount >= milestoneCount && !achievedMilestones.includes(milestoneCount)) {
                            const rewardAmount = parseFloat(milestonesConfig[milestone]);
                            await trx('users').where('id', sponsor.id).increment('stbl_token_balance', rewardAmount);
                            achievedMilestones.push(milestoneCount);
                            awardedTokenAmount += rewardAmount;
                        }
                    }
                    if (awardedTokenAmount > 0) {
                         await trx('users').where('id', sponsor.id).update({ achieved_promoter_milestones: JSON.stringify(achievedMilestones) });
                    }

                    if (usdtCommissionAmount > 0 || awardedTokenAmount > 0) {
                        await trx('promoter_commissions').insert({
                            promoter_id: sponsor.id, from_user_id: userId,
                            commission_amount: usdtCommissionAmount, token_commission_amount: awardedTokenAmount,
                            commission_type: 'DIRECT_REFERRAL_BONUS'
                        });
                         console.log(`[Promoter] Awarded EXTRA $${usdtCommissionAmount} and ${awardedTokenAmount} STBL to Promoter ID ${sponsor.id}.`);
                    }
                }
            }
        }

        // --- PROMOTER TEAM COMMISSION LOGIC ---
        const promoterTeamCommissionSetting = await trx('system_settings')
            .where('setting_key', 'promoter_team_commission_usdt')
            .first();
        
        const teamCommissionAmount = parseFloat(promoterTeamCommissionSetting?.setting_value || 0);

        if (teamCommissionAmount > 0) {
            const uplinePromoter = await findUplinePromoter(userId, trx);
            if (uplinePromoter) {
                console.log(`[Promoter Team Commission] Found upline promoter: ID ${uplinePromoter.id}. Awarding $${teamCommissionAmount}.`);
                
                // ✅ FIX: Also increment withdrawable_balance
                await trx('users')
                    .where('id', uplinePromoter.id)
                    .increment({
                        'withdrawable_balance': teamCommissionAmount,
                        'total_earnings': teamCommissionAmount
                    });

                await trx('admin_earnings').insert({
                    user_id: userId,
                    sponsor_id: uplinePromoter.id,
                    amount: -teamCommissionAmount,
                    type: 'PROMOTER_TEAM_PAYOUT',
                    notes: `Team commission for activation of user ${userId}`
                });

                await trx('promoter_commissions').insert({
                    promoter_id: uplinePromoter.id,
                    from_user_id: userId,
                    commission_amount: teamCommissionAmount,
                    token_commission_amount: 0,
                    commission_type: 'TEAM_ACTIVATION_BONUS'
                });
            } else {
                 console.log(`[Promoter Team Commission] No upline promoter found for user ${userId}.`);
            }
        }
        
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