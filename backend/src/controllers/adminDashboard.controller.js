// backend/src/controllers/adminDashboard.controller.js (FINAL AND CORRECTED VERSION)

const db = require('../config/db.config');
const { logAdminActivity } = require('../services/adminActivity.service');

exports.getDashboardStats = async (req, res) => {
    try {
        // --- User and Withdrawal Stats ---
        const maxIdResult = await db('users').max('id as maxId').first();
        const totalUsers = maxIdResult.maxId ? maxIdResult.maxId - 1 : 0;
        const { activeUsers } = await db('users').where('status', 'ACTIVE').count('* as activeUsers').first();
        const { pendingWithdrawals } = await db('withdrawals').where('status', 'PENDING').count('* as pendingWithdrawals').first();

        // --- ✅✅✅ START: CORRECTED System Wallet Balance Calculation ✅✅✅ ---
        const totalTurnover = parseFloat(activeUsers || 0) * 20.0;

        const totalWithdrawnResult = await db('withdrawals')
            .where('status', 'COMPLETED')
            .sum('final_amount as total')
            .first();
        const totalWithdrawnByUsers = parseFloat(totalWithdrawnResult.total || 0);

        // This calculation is still needed for the "Paid to Promoters" card
        const promoterPayoutsResult = await db('admin_earnings')
            .whereIn('type', ['PROMOTER_PAYOUT', 'PROMOTER_TEAM_PAYOUT'])
            .sum('amount as total')
            .first();
        const totalPaidToPromoters = Math.abs(parseFloat(promoterPayoutsResult.total || 0));

        // ✅ YOUR NEW FORMULA: Turnover - External Withdrawals = System Balance
        const systemWalletBalance = totalTurnover - totalWithdrawnByUsers;
        // --- ✅✅✅ END: CORRECTED System Wallet Balance Calculation ✅✅✅ ---
        
        // --- Other Card Calculations (no changes here) ---
        const adminJoiningFeesResult = await db('admin_earnings').where('type', 'JOINING_FEE').sum('amount as total').first();
        const adminDirectReferralFeesResult = await db('admin_earnings').where({ type: 'DIRECT_REFERRAL', sponsor_id: 1 }).sum('amount as total').first();
        const adminWithdrawalFeesResult = await db('admin_earnings').whereIn('type', ['WITHDRAWAL_FEE', 'P2P_FEE']).sum('amount as total').first();
        const userReferralPayoutsResult = await db('admin_earnings').where('type', 'DIRECT_REFERRAL').andWhereNot('sponsor_id', 1).sum('amount as total').first();
        const totalPoolPayoutsResult = await db('admin_earnings').where('type', 'POOL_PAYOUT').sum('amount as totalPayouts').first();
        
        const totalPoolContribution = parseFloat(activeUsers || 0) * 10.0;
        const totalPoolPayouts = Math.abs(parseFloat(totalPoolPayoutsResult.totalPayouts || 0));
        const currentPoolBalance = totalPoolContribution - totalPoolPayouts;

        const totalStblResult = await db('stbl_token_rewards').sum('amount as total').first();
        const totalStblAwarded = parseFloat(totalStblResult.total || 0);
        const { pendingStblTransfers } = await db('stbl_token_rewards').where('status', 'PENDING_TRANSFER').count('* as pendingStblTransfers').first();
        
        // --- Final Response Object ---
        res.json({
            totalUsers: parseInt(totalUsers || 0),
            activeUsers: parseInt(activeUsers || 0),
            pendingWithdrawals: parseInt(pendingWithdrawals || 0),
            
            systemWalletBalance: systemWalletBalance.toFixed(2), // This now uses your correct formula
            
            adminJoiningFees: parseFloat(adminJoiningFeesResult.total || 0).toFixed(2),
            adminDirectReferralFees: parseFloat(adminDirectReferralFeesResult.total || 0).toFixed(2),
            userReferralBonusPayouts: Math.abs(parseFloat(userReferralPayoutsResult.total || 0)).toFixed(2),
            totalPromoterPayouts: totalPaidToPromoters.toFixed(2),
            adminWithdrawalFees: parseFloat(adminWithdrawalFeesResult.total || 0).toFixed(2),
            totalTurnover: totalTurnover.toFixed(2),
            totalPoolContribution: totalPoolContribution.toFixed(2),
            totalPoolPayouts: totalPoolPayouts.toFixed(2),
            totalWithdrawnByUsers: totalWithdrawnByUsers.toFixed(2),
            currentPoolBalance: currentPoolBalance.toFixed(2),
            totalStblAwarded: totalStblAwarded.toLocaleString(),
            pendingStblTransfers: parseInt(pendingStblTransfers, 10),
        });
    } catch (e) {
        console.error("ADMIN STATS ERROR:", e);
        res.status(500).json({ message: 'Server error fetching admin stats', error: e.message });
    }
};

// --- Other functions remain unchanged ---

exports.getFinancialReport = async (req, res) => {
    try {
        const incomeResult = await db('admin_earnings').whereIn('type', ['JOINING_FEE', 'WITHDRAWAL_FEE', 'P2P_FEE']).orWhere({ type: 'DIRECT_REFERRAL', sponsor_id: 1 }).sum('amount as total').first();
        const totalSystemIncome = parseFloat(incomeResult.total || 0);
        const expensesResult = await db('admin_earnings').whereIn('type', ['POOL_PAYOUT', 'PROMOTER_TEAM_PAYOUT', 'PROMOTER_PAYOUT']).orWhere(function() { this.where('type', 'DIRECT_REFERRAL').andWhereNot('sponsor_id', 1) }).sum('amount as total').first();
        const totalSystemExpenses = Math.abs(parseFloat(expensesResult.total || 0));
        const netProfit = totalSystemIncome - totalSystemExpenses;

        res.json({
            totalIncome: totalSystemIncome.toFixed(2),
            totalExpenses: totalSystemExpenses.toFixed(2),
            netProfit: netProfit.toFixed(2),
        });
    } catch (error) {
        console.error("FINANCIAL REPORT ERROR:", error);
        res.status(500).json({ message: 'Error fetching financial report.' });
    }
};

exports.getFinancialTransactions = async (req, res) => {
    try {
        const transactions = await db('admin_earnings as ae')
            .leftJoin('users as u', 'ae.user_id', 'u.id')
            .leftJoin('users as sponsor', 'ae.sponsor_id', 'sponsor.id')
            .select('ae.id', 'ae.created_at', 'ae.type', 'ae.amount', 'u.email as user_email', 'sponsor.email as sponsor_email')
            .orderBy('ae.created_at', 'desc').limit(100);
        res.json(transactions);
    } catch (error) {
        console.error("GET FINANCIAL TRANSACTIONS ERROR:", error);
        res.status(500).json({ message: 'Error fetching financial transactions.' });
    }
};

exports.getSystemHealth = async (req, res) => {
    try {
        const healthChecks = await db('system_health_checks').select('*');
        res.json(healthChecks);
    } catch (error) {
        console.error("GET SYSTEM HEALTH ERROR:", error);
        res.status(500).json({ message: 'Failed to fetch system health status.' });
    }
};

exports.getSystemMetrics = async (req, res) => {
    try {
        const { pendingWithdrawalsCount } = await db('withdrawals').where('status', 'PENDING').count('* as pendingWithdrawalsCount').first();
        const { failedWithdrawalsCount } = await db('withdrawals').where('status', 'FAILED').count('* as failedWithdrawalsCount').first();
        const { unplacedQueueLength } = await db('users').where({ status: 'ACTIVE', current_pool: 1, original_sponsor_id: null }).whereNotIn('id', [1, 2]).count('* as unplacedQueueLength').first();
        const lastDeposit = await db('partial_deposits').orderBy('created_at', 'desc').first('created_at');
        res.json({
            pendingWithdrawals: { count: parseInt(pendingWithdrawalsCount, 10), status: parseInt(pendingWithdrawalsCount, 10) > 5 ? 'WARNING' : 'OK' },
            failedWithdrawals: { count: parseInt(failedWithdrawalsCount, 10), status: parseInt(failedWithdrawalsCount, 10) > 0 ? 'ERROR' : 'OK' },
            unplacedQueue: { count: parseInt(unplacedQueueLength, 10), status: parseInt(unplacedQueueLength, 10) > 20 ? 'WARNING' : 'OK' },
            hotWalletBalance: { value: 'N/A', status: 'INFO' },
            lastDepositTimestamp: { value: lastDeposit ? lastDeposit.created_at : 'Never', status: 'INFO' }
        });
    } catch (error) {
        console.error("GET SYSTEM METRICS ERROR:", error);
        res.status(500).json({ message: 'Failed to fetch system metrics.' });
    }
};

exports.getAdminActivityLogs = async (req, res) => {
    try {
        const logs = await db('admin_activity_logs as l')
            .join('users as admin', 'l.admin_id', 'admin.id')
            .leftJoin('users as target', 'l.target_user_id', 'target.id')
            .select('l.*', 'admin.email as admin_email', 'target.email as target_user_email')
            .orderBy('l.created_at', 'desc').limit(100);
        res.json(logs);
    } catch (error) {
        console.error("GET ADMIN LOGS ERROR:", error);
        res.status(500).json({ message: 'Error fetching admin activity logs.' });
    }
};

exports.getSystemSettings = async (req, res) => {
    try {
        const settings = await db('system_settings').select('setting_key', 'setting_value');
        const settingsMap = settings.reduce((acc, setting) => {
            acc[setting.setting_key] = setting.setting_value;
            return acc;
        }, {});
        res.json(settingsMap);
    } catch (error) {
        console.error("GET SYSTEM SETTINGS ERROR:", error);
        res.status(500).json({ message: 'Failed to fetch system settings.' });
    }
};

exports.updateSystemSettings = async (req, res) => {
    const newSettings = req.body;
    const adminId = req.user.id;
    const allowedKeys = ['promoter_referral_commission_usdt', 'promoter_milestones_config', 'promoter_team_commission_usdt'];
    try {
        await db.transaction(async trx => {
            const updatePromises = [];
            for (const key in newSettings) {
                if (allowedKeys.includes(key)) {
                    const value = newSettings[key];
                    if (key === 'promoter_milestones_config') {
                        try { JSON.parse(value); } catch (e) { throw new Error('Invalid JSON format for milestones configuration.'); }
                    }
                    const promise = trx('system_settings')
                        .insert({ setting_key: key, setting_value: value })
                        .onConflict('setting_key').merge();
                    updatePromises.push(promise);
                }
            }
            if (updatePromises.length === 0) {
                throw new Error('No valid settings provided to update.');
            }
            await Promise.all(updatePromises);
            await logAdminActivity(adminId, 'SETTINGS_UPDATE', null, { updatedKeys: Object.keys(newSettings) }, trx);
        });
        res.json({ message: 'Settings updated successfully.' });
    } catch (error) {
        console.error("UPDATE SYSTEM SETTINGS ERROR:", error);
        res.status(400).json({ message: error.message || 'Failed to update settings.' });
    }
};