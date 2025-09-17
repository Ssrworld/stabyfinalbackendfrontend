// backend/src/controllers/user.controller.js (FINAL AND GUARANTEED LOGIC FIX)

const db = require('../config/db.config');
const { sendWithdrawalRequestEmail } = require('../services/email.service');
const bcrypt = require('bcryptjs');
const { sanitize } = require('../services/sanitizer.service');
const userService = require('../services/user.service');

exports.getDashboardData = async (req, res) => {
    try {
        const user = await db('users')
            .select(
                'id', 'email', 'role', 'status', 'wallet_address', 'payout_wallet',
                'current_pool', 'total_earnings', 'withdrawable_balance', 'main_balance',
                'stbl_token_balance', 'referral_code', 'created_at', 'global_placement_id'
            )
            .where('id', req.user.id)
            .first();

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // --- DISPLAY CALCULATIONS (These are for UI breakdown only) ---
        const directReferralResult = await db('admin_earnings').where({ sponsor_id: user.id, type: 'DIRECT_REFERRAL' }).sum('amount as total').first();
        const totalReferralEarnings = Math.abs(parseFloat(directReferralResult.total || 0));

        const poolEarningsResult = await db('admin_earnings').where({ user_id: user.id, type: 'POOL_PAYOUT' }).sum('amount as total').first();
        const totalPoolEarnings = Math.abs(parseFloat(poolEarningsResult.total || 0));
        
        const promoterEarningsResult = await db('admin_earnings').where({ sponsor_id: user.id }).whereIn('type', ['PROMOTER_PAYOUT', 'PROMOTER_TEAM_PAYOUT']).sum('amount as total').first();
        const totalPromoterEarnings = Math.abs(parseFloat(promoterEarningsResult.total || 0));

        const recalculatedTotalEarnings = totalReferralEarnings + totalPoolEarnings + totalPromoterEarnings;
        
        // --- PERMISSION & BALANCE LOGIC (THE FINAL FIX IS HERE) ---
        const { activeReferralsCount } = await db('users').where({ referred_by: user.id, status: 'ACTIVE' }).count('* as activeReferralsCount').first();
        const canAccessPoolFunds = parseInt(activeReferralsCount, 10) >= 3;
        
        const trueWithdrawableBalance = parseFloat(user.withdrawable_balance);
        let maxAllowedToAccess;

        if (canAccessPoolFunds) {
            // Agar user ke 3+ referrals hain, to wo apna poora balance access kar sakta hai.
            maxAllowedToAccess = trueWithdrawableBalance;
        } else {
            // Agar nahi, to accessible balance uske poore balance me se pool se kamaye hue paise hatakar milta hai.
            const accessibleBalance = trueWithdrawableBalance - totalPoolEarnings;
            
            // Ye ensure karta hai ki balance kabhi negative na dikhe.
            maxAllowedToAccess = Math.max(0, accessibleBalance);
        }

        // --- OTHER DATA ---
        const { totalDeposit } = await db('partial_deposits').where({ user_id: req.user.id, is_processed: false }).sum('amount as totalDeposit').first();
        const depositedBalance = parseFloat(totalDeposit || 0);
        const directReferrals = await db('users').select('id', 'email', 'status', 'created_at').where('referred_by', user.id).orderBy('id', 'asc');
        const stblReward = await db('stbl_token_rewards').where({ user_id: user.id }).orderBy('created_at', 'desc').first();

        res.json({
            ...user,
            withdrawable_balance: maxAllowedToAccess.toFixed(2),
            withdrawable_p2p_limit: maxAllowedToAccess.toFixed(2),
            total_earnings: recalculatedTotalEarnings.toFixed(2),
            totalReferralEarnings: totalReferralEarnings.toFixed(2),
            rewardProgramEarnings: totalPoolEarnings.toFixed(2),
            depositedBalance,
            directReferrals,
            activeDirectReferrals: parseInt(activeReferralsCount, 10),
            stblRewardStatus: stblReward ? stblReward.status : null,
        });
    } catch (error) {
        console.error("DASHBOARD DATA ERROR:", error);
        res.status(500).json({ message: 'Error fetching dashboard data.' });
    }
};

// --- BAAKI KE SARE FUNCTIONS WAISE HI RAHENGE ---
// (neeche ke code me koi badlav nahi hai)

exports.activateAccount = async (req, res) => {
    try {
        const result = await userService.activateUser(req.user.id);
        res.json({ message: result.message });
    } catch (error) {
        console.error(`ACTIVATION ERROR for User ID ${req.user.id}:`, error.message);
        res.status(400).json({ message: error.message || 'Failed to activate account.' });
    }
};

exports.transferFunds = async (req, res) => {
    const { recipientEmail, amount, password, sourceWallet = 'main' } = req.body;
    const senderId = req.user.id;
    const totalDeducted = parseFloat(amount);
    const P2P_FEE_PERCENT = 10;
    const REQUIRED_REFERRALS_FOR_POOL_ACCESS = 3;

    if (!recipientEmail || !totalDeducted || totalDeducted <= 0 || !password) {
        return res.status(400).json({ message: 'Recipient email, amount, and your password are required.' });
    }
    if (!['main', 'withdrawable'].includes(sourceWallet)) {
        return res.status(400).json({ message: 'Invalid source wallet specified.' });
    }

    try {
        let recipientGets = 0;
        await db.transaction(async trx => {
            const sender = await trx('users').where('id', senderId).forUpdate().first();
            if (!sender) throw new Error('Sender not found.');
            const isMatch = await bcrypt.compare(password, sender.password_hash);
            if (!isMatch) throw new Error('Invalid password.');
            const recipient = await trx('users').where('email', recipientEmail).forUpdate().first();
            if (!recipient) throw new Error('Recipient user not found.');
            if (recipient.id === sender.id) throw new Error('You cannot send funds to yourself.');

            if (sourceWallet === 'main') {
                if (parseFloat(sender.main_balance) < totalDeducted) {
                    throw new Error('Insufficient funds in your main wallet.');
                }
                recipientGets = totalDeducted;
                await trx('users').where('id', sender.id).decrement('main_balance', totalDeducted);
                await trx('users').where('id', recipient.id).increment('main_balance', recipientGets);
            } else {
                const fee = (totalDeducted * P2P_FEE_PERCENT) / 100;
                recipientGets = totalDeducted - fee;
                const totalWithdrawableBalanceInDb = parseFloat(sender.withdrawable_balance);

                if (totalWithdrawableBalanceInDb < totalDeducted) {
                    throw new Error('Insufficient funds in your withdrawable balance.');
                }
                
                const referralEarningsResult = await trx('admin_earnings').where({ sponsor_id: sender.id, type: 'DIRECT_REFERRAL' }).sum('amount as total').first();
                const totalCommissionEarned = Math.abs(parseFloat(referralEarningsResult.total || 0));
                
                const promoterEarningsResult = await trx('admin_earnings').where({ sponsor_id: sender.id }).whereIn('type', ['PROMOTER_PAYOUT', 'PROMOTER_TEAM_PAYOUT']).sum('amount as total').first();
                const totalPromoterEarnings = Math.abs(parseFloat(promoterEarningsResult.total || 0));

                const { count } = await trx('users').where({ referred_by: sender.id, status: 'ACTIVE' }).count('* as count').first();
                const activeReferralsCount = parseInt(count, 10);
                const canAccessPoolFunds = activeReferralsCount >= REQUIRED_REFERRALS_FOR_POOL_ACCESS;

                let maxAllowedToTransfer = totalWithdrawableBalanceInDb;
                if (!canAccessPoolFunds) {
                    const unlockedEarnings = totalCommissionEarned + totalPromoterEarnings;
                    maxAllowedToTransfer = Math.min(totalWithdrawableBalanceInDb, unlockedEarnings);
                }

                if (totalDeducted > maxAllowedToTransfer) {
                    const poolBalance = totalWithdrawableBalanceInDb - maxAllowedToTransfer;
                    throw new Error(`You can only transfer your unlocked earnings. Your locked pool balance is $${poolBalance.toFixed(2)}.`);
                }

                await trx('users').where('id', sender.id).decrement('withdrawable_balance', totalDeducted);
                await trx('users').where('id', recipient.id).increment('main_balance', recipientGets);

                if (fee > 0) {
                    await trx('admin_earnings').insert({
                        user_id: sender.id,
                        type: 'P2P_FEE',
                        amount: fee,
                        notes: `Fee for P2P transfer to ${recipient.email}`
                    });
                }
            }
            
            await trx('fund_transfers').insert({
                sender_id: sender.id,
                recipient_id: recipient.id,
                amount: recipientGets,
            });
        });

        res.json({ message: `$${recipientGets.toFixed(2)} successfully sent to ${recipientEmail}.` });
    } catch (error) {
        console.error(`FUND TRANSFER ERROR from User ID ${senderId}:`, error);
        res.status(400).json({ message: error.message || 'Fund transfer failed.' });
    }
};

exports.claimStblReward = async (req, res) => {
    const { walletAddress } = req.body;
    const userId = req.user.id;
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) { return res.status(400).json({ message: 'A valid BEP-20 wallet address is required.' }); }
    try {
        const reward = await db('stbl_token_rewards').where({ user_id: userId, status: 'UNCLAIMED' }).first();
        if (!reward) { return res.status(404).json({ message: 'No claimable reward found or reward already processed.' }); }
        await db('stbl_token_rewards').where('id', reward.id).update({ payout_wallet_address: walletAddress, status: 'PENDING_TRANSFER' });
        res.json({ message: 'Reward claimed successfully! Your tokens are scheduled for transfer.' });
    } catch (error) { console.error(`STBL REWARD CLAIM ERROR for User ID ${userId}:`, error); res.status(500).json({ message: 'Server error during reward claim.' }); }
};

exports.updatePayoutWallet = async (req, res) => {
    const { payout_wallet } = req.body;
    if (!payout_wallet || !/^0x[a-fA-F0-9]{40}$/.test(payout_wallet)) { return res.status(400).json({ message: 'A valid BEP-20 wallet address is required.' }); }
    try {
        await db('users').where('id', req.user.id).update({ payout_wallet });
        res.json({ message: 'Payout wallet updated successfully.' });
    } catch (error) { console.error("UPDATE WALLET ERROR:", error); res.status(500).json({ message: 'Error updating wallet address.' }); }
};

exports.requestWithdrawal = async (req, res) => {
    const requestedAmount = parseFloat(req.body.amount);
    const ADMIN_WITHDRAWAL_FEE_PERCENT = 10;
    const REQUIRED_REFERRALS_FOR_POOL_WITHDRAWAL = 3;

    if (!requestedAmount || requestedAmount <= 0) { 
        return res.status(400).json({ message: 'A valid withdrawal amount is required.' }); 
    }

    try {
        let finalAmountToSend;
        await db.transaction(async trx => {
            const user = await trx('users').where('id', req.user.id).forUpdate().first();

            if (!user) throw new Error('User not found.');
            if (user.status !== 'ACTIVE') throw new Error('Your account must be active to request a withdrawal.');
            if (!user.payout_wallet) throw new Error('Please set your payout wallet address first.');

            const totalWithdrawableBalanceInDb = parseFloat(user.withdrawable_balance);
            if (totalWithdrawableBalanceInDb < requestedAmount) {
                throw new Error('Insufficient balance.');
            }

            const referralEarningsResult = await trx('admin_earnings').where({ sponsor_id: user.id, type: 'DIRECT_REFERRAL' }).sum('amount as totalReferralEarnings').first();
            const totalCommissionEarned = Math.abs(parseFloat(referralEarningsResult.totalReferralEarnings || 0));
            
            const promoterEarningsResult = await trx('admin_earnings').where({ sponsor_id: user.id }).whereIn('type', ['PROMOTER_PAYOUT', 'PROMOTER_TEAM_PAYOUT']).sum('amount as total').first();
            const totalPromoterEarnings = Math.abs(parseFloat(promoterEarningsResult.total || 0));

            const { count } = await trx('users').where({ referred_by: user.id, status: 'ACTIVE' }).count('* as count').first();
            const activeReferralsCount = parseInt(count, 10);
            const canWithdrawPool = activeReferralsCount >= REQUIRED_REFERRALS_FOR_POOL_WITHDRAWAL;

            let maxAllowedToWithdraw = 0;
            if(canWithdrawPool) {
                maxAllowedToWithdraw = totalWithdrawableBalanceInDb;
            } else {
                const unlockedEarnings = totalCommissionEarned + totalPromoterEarnings;
                maxAllowedToWithdraw = Math.min(totalWithdrawableBalanceInDb, unlockedEarnings);
            }

            if (requestedAmount > maxAllowedToWithdraw) {
                const poolEarnings = totalWithdrawableBalanceInDb - maxAllowedToWithdraw;
                const errorMessage = `You can only withdraw your unlocked earnings ($${maxAllowedToWithdraw.toFixed(2)}) until you have ${REQUIRED_REFERRALS_FOR_POOL_WITHDRAWAL} active direct referrals. Your locked pool earnings of $${poolEarnings.toFixed(2)} cannot be withdrawn yet.`;
                throw new Error(errorMessage);
            }

            await trx('users').where('id', req.user.id).decrement('withdrawable_balance', requestedAmount);
            const adminFee = (requestedAmount * ADMIN_WITHDRAWAL_FEE_PERCENT) / 100;
            finalAmountToSend = requestedAmount - adminFee;
            await trx('withdrawals').insert({ user_id: req.user.id, amount: requestedAmount, admin_fee: adminFee, final_amount: finalAmountToSend });
            if (adminFee > 0) { 
                await trx('admin_earnings').insert({ user_id: req.user.id, type: 'WITHDRAWAL_FEE', amount: adminFee, notes: `Withdrawal Fee for $${requestedAmount}` }); 
            }
        });

        await sendWithdrawalRequestEmail(req.user.email, requestedAmount);
        res.json({ message: `Withdrawal request for $${requestedAmount.toFixed(2)} submitted. You will receive $${finalAmountToSend.toFixed(2)}.` });
    } catch (error) { 
        console.error("WITHDRAWAL ERROR:", error); 
        res.status(400).json({ message: error.message || 'Server error during withdrawal request.' }); 
    }
};

exports.getDepositHistory = async (req, res) => { try { const rows = await db('partial_deposits').select('tx_hash', 'amount', 'created_at').where('user_id', req.user.id).orderBy('created_at', 'desc'); res.json(rows.map(row => ({ ...row, status: 'VERIFIED' }))); } catch (error) { console.error("DEPOSIT HISTORY ERROR:", error); res.status(500).json({ message: 'Error fetching deposit history.' }); } };
exports.getWithdrawalHistory = async (req, res) => { try { const rows = await db('withdrawals').select('amount', 'final_amount', 'admin_fee', 'status', 'tx_hash', 'created_at', 'completed_at').where('user_id', req.user.id).orderBy('created_at', 'desc'); res.json(rows); } catch (error) { console.error("WITHDRAWAL HISTORY ERROR:", error); res.status(500).json({ message: 'Error fetching withdrawal history.' }); } };
exports.getCommissionHistory = async (req, res) => { try { const commissions = await db('admin_earnings as ae').join('users as u', 'ae.user_id', 'u.id').select('u.email as referred_user_email', db.raw('abs(ae.amount) as amount'), 'ae.created_at').where({ 'ae.sponsor_id': req.user.id, 'ae.type': 'DIRECT_REFERRAL' }).orderBy('ae.created_at', 'desc'); res.json(commissions); } catch (error) { console.error("COMMISSION HISTORY ERROR:", error); res.status(500).json({ message: 'Error fetching commission history.' }); } };
exports.getFundTransferHistory = async (req, res) => { const userId = req.user.id; try { const transfers = await db('fund_transfers as ft').leftJoin('users as sender', 'ft.sender_id', 'sender.id').leftJoin('users as recipient', 'ft.recipient_id', 'recipient.id').select('ft.id', 'ft.amount', 'ft.created_at', 'sender.email as sender_email', 'recipient.email as recipient_email').where('ft.sender_id', userId).orWhere('ft.recipient_id', userId).orderBy('ft.created_at', 'desc'); res.json(transfers.map(t => ({ id: t.id, date: t.created_at, amount: parseFloat(t.amount).toFixed(2), type: t.sender_email === req.user.email ? 'Sent' : 'Received', counterparty: t.sender_email === req.user.email ? t.recipient_email : t.sender_email }))); } catch (error) { console.error("FUND TRANSFER HISTORY ERROR:", error); res.status(500).json({ message: 'Error fetching transfer history.' }); } };
exports.getStblTokenHistory = async (req, res) => { const userId = req.user.id; try { const rewards = await db('stbl_token_rewards').where({ user_id: userId }).select('amount', 'reason as details', 'created_at'); const history = rewards.map(r => ({ ...r, type: 'Reward' })); history.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); res.json(history); } catch (error) { console.error("STBL TOKEN HISTORY ERROR:", error); res.status(500).json({ message: 'Error fetching STBL token history.' }); } };
exports.verifyUserToken = async (req, res) => { try { const user = await db('users').select('id', 'email', 'status').where('id', req.user.id).first(); if (!user) return res.status(404).json({ message: 'User not found.' }); res.json({ ...user, isAdmin: user.id === 1 }); } catch (error) { console.error("VERIFY TOKEN ERROR:", error); res.status(500).json({ message: 'Error verifying user session.' }); } };
exports.createTicket = async (req, res) => { let { subject, message } = req.body; subject = sanitize(subject); message = sanitize(message); if (!subject || !message) { return res.status(400).json({ message: 'Subject and message are required.' }); } const trx = await db.transaction(); try { let ticketData; const ticketPayload = { user_id: req.user.id, subject, }; const dbClient = db.client.config.client; if (dbClient === 'pg' || dbClient === 'oracledb' || dbClient === 'mssql') { [ticketData] = await trx('support_tickets').insert(ticketPayload).returning('*'); } else { const [insertedId] = await trx('support_tickets').insert(ticketPayload); if (!insertedId) { throw new Error("Database did not return a ticket ID after insertion."); } ticketData = await trx('support_tickets').where('id', insertedId).first(); } if (!ticketData || !ticketData.id) { throw new Error("Failed to retrieve ticket data after creation."); } let attachmentData = null; if (req.file) { attachmentData = { type: req.file.mimetype.startsWith('video') ? 'video' : 'image', url: req.file.path, public_id: req.file.filename }; } await trx('ticket_replies').insert({ ticket_id: ticketData.id, user_id: req.user.id, message: message, attachment: attachmentData ? JSON.stringify(attachmentData) : null }); await trx.commit(); res.status(201).json({ message: 'Support ticket created successfully.', ticket: ticketData }); } catch (error) { await trx.rollback(); console.error("CREATE TICKET ERROR:", error); res.status(500).json({ message: 'Failed to create ticket.' }); } };
exports.getUserTickets = async (req, res) => { try { const tickets = await db('support_tickets').where({ user_id: req.user.id }).orderBy('updated_at', 'desc'); res.json(tickets); } catch (error) { console.error("GET USER TICKETS ERROR:", error); res.status(500).json({ message: 'Failed to fetch tickets.' }); } };
exports.getTicketById = async (req, res) => { try { const ticket = await db('support_tickets').where({ id: req.params.id, user_id: req.user.id }).first(); if (!ticket) return res.status(404).json({ message: 'Ticket not found or access denied.' }); const replies = await db('ticket_replies').join('users', 'ticket_replies.user_id', 'users.id').where({ ticket_id: req.params.id }).select('ticket_replies.*', 'users.email').orderBy('created_at', 'asc'); const parsedReplies = replies.map(reply => { if (reply.attachment && typeof reply.attachment === 'string') { try { reply.attachment = JSON.parse(reply.attachment); } catch (e) { console.warn(`Could not parse attachment JSON for reply ID ${reply.id}`); reply.attachment = null; } } return reply; }); res.json({ ticket, replies: parsedReplies }); } catch (error) { console.error("GET TICKET BY ID ERROR:", error); res.status(500).json({ message: 'Failed to fetch ticket details.' }); } };
exports.createTicketReply = async (req, res) => { let { message } = req.body; message = sanitize(message); let attachmentData = null; if (req.file) attachmentData = { type: req.file.mimetype.startsWith('video') ? 'video' : 'image', url: req.file.path, public_id: req.file.filename }; if (!message && !attachmentData) return res.status(400).json({ message: 'Reply must have a message or an attachment.' }); try { const ticket = await db('support_tickets').where({ id: req.params.id, user_id: req.user.id }).first(); if (!ticket) return res.status(404).json({ message: 'Ticket not found or access denied.' }); await db('ticket_replies').insert({ ticket_id: req.params.id, user_id: req.user.id, message: message || '', attachment: attachmentData ? JSON.stringify(attachmentData) : null }); await db('support_tickets').where({ id: req.params.id }).update({ status: 'OPEN', updated_at: new Date() }); res.status(201).json({ message: 'Reply added successfully.' }); } catch (error) { console.error("CREATE REPLY ERROR:", error); res.status(500).json({ message: 'Failed to add reply.' }); } };
exports.getLatestAnnouncements = async (req, res) => { try { const announcements = await db('announcements').where('status', 'PUBLISHED').orderBy('created_at', 'desc').limit(3); res.json(announcements); } catch (error) { console.error("GET LATEST ANNOUNCEMENTS ERROR:", error); res.status(500).json({ message: 'Failed to fetch announcements.' }); } };
exports.getHomepageAnnouncements = async (req, res) => { try { const announcements = await db('announcements').where({ status: 'PUBLISHED', show_on_homepage: true }).orderBy('created_at', 'desc').limit(5); res.json(announcements); } catch (error) { console.error("GET HOMEPAGE ANNOUNCEMENTS ERROR:", error); res.status(500).json({ message: 'Failed to fetch homepage announcements.' }); } };
exports.getActiveAnnouncementsForUser = async (req, res) => { try { const announcements = await db('announcements').where({ status: 'PUBLISHED' }).orderBy('created_at', 'desc').limit(5); res.json(announcements); } catch (error) { console.error("GET ACTIVE ANNOUNCEMENTS ERROR:", error); res.status(500).json({ message: 'Failed to fetch announcements.' }); } };

const fetchDownline = async (userId, trx) => {
    const directReferrals = await trx('users')
        .where('referred_by', userId)
        .select('id', 'email', 'status', 'activation_timestamp');
    if (directReferrals.length === 0) {
        return [];
    }
    const children = await Promise.all(
        directReferrals.map(async (child) => {
            const childsDownline = await fetchDownline(child.id, trx);
            return {
                ...child,
                children: childsDownline,
            };
        })
    );
    return children;
};

exports.getReferralTree = async (req, res) => {
    const userId = req.user.id;
    try {
        await db.transaction(async trx => {
            const rootUser = await trx('users')
                .where('id', userId)
                .select('id', 'email', 'status', 'activation_timestamp')
                .first();
            if (!rootUser) {
                return res.status(404).json({ message: 'User not found.' });
            }
            const downline = await fetchDownline(userId, trx);
            const treeData = {
                ...rootUser,
                children: downline,
            };
            res.json(treeData);
        });
    } catch (error) {
        console.error(`GET REFERRAL TREE ERROR for User ID ${userId}:`, error);
        res.status(500).json({ message: 'Failed to fetch team data.' });
    }
};