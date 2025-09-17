// backend/src/controllers/adminTransaction.controller.js (FULL FILE WITH NEW ENDPOINT)

const db = require('../config/db.config');
const { logAdminActivity } = require('../services/adminActivity.service');

exports.getAllTransactions = async (req, res) => {
    try {
        const { type = 'all', search = '' } = req.query;
        const depositsQuery = db('transactions as t')
            .join('users as u', 't.user_id', 'u.id')
            .select(db.raw("'Deposit' as type"), 'u.email as email', 't.amount', 't.status', 't.tx_hash', 't.created_at');
        const withdrawalsQuery = db('withdrawals as w')
            .join('users as u', 'w.user_id', 'u.id')
            .select(db.raw("'Withdrawal' as type"), 'u.email as email', 'w.amount', 'w.status', 'w.tx_hash', 'w.completed_at as created_at');
        if (search) {
            depositsQuery.where('u.email', 'like', `%${search}%`);
            withdrawalsQuery.where('u.email', 'like', `%${search}%`);
        }
        let finalQuery;
        if (type === 'deposit') { finalQuery = depositsQuery.orderBy('created_at', 'desc').limit(100); }
        else if (type === 'withdrawal') { finalQuery = withdrawalsQuery.orderBy('created_at', 'desc').limit(100); }
        else {
            const unionQuery = depositsQuery.unionAll(withdrawalsQuery);
            finalQuery = db.from(unionQuery.as('t')).orderBy('t.created_at', 'desc').limit(100);
        }
        const transactions = await finalQuery;
        res.json(transactions);
    } catch (e) {
        console.error("ADMIN GET TRANSACTIONS ERROR:", e);
        res.status(500).json({ message: 'Server error fetching transactions', error: e.message });
    }
};

exports.getAdminTransactionHistory = async (req, res) => {
    try {
        const history = await db('admin_transactions as at')
            .join('users as u', 'at.user_id', 'u.id')
            .join('users as admin', 'at.admin_id', 'admin.id')
            .select('at.id', 'at.amount', 'at.type', 'at.reason', 'at.created_at', 'u.email as user_email', 'admin.email as admin_email')
            .orderBy('at.created_at', 'desc').limit(100);
        res.json(history);
    } catch (error) {
        console.error("ADMIN GET MANUAL TRANSACTIONS ERROR:", error);
        res.status(500).json({ message: 'Failed to fetch admin transaction history.' });
    }
};

exports.getAdminEarnings = async (req, res) => {
    try {
        const earnings = await db('admin_earnings as ae')
            .join('users as u', 'ae.user_id', 'u.id')
            .where('ae.amount', '>', 0)
            .select('ae.id', 'ae.user_id', 'u.email', 'ae.type', 'ae.amount', 'ae.created_at')
            .orderBy('ae.created_at', 'desc').limit(100);
        res.json(earnings);
    } catch (e) {
        console.error("ADMIN GET EARNINGS ERROR:", e);
        res.status(500).json({ message: 'Server error fetching admin earnings', error: e.message });
    }
};

exports.getPendingWithdrawals = async (req, res) => {
    try {
        const withdrawals = await db('withdrawals as w')
            .join('users as u', 'w.user_id', 'u.id')
            .select('w.id', 'u.email', 'w.amount', 'w.final_amount', 'u.payout_wallet', 'w.created_at')
            .where('w.status', 'PENDING')
            .orderBy('w.created_at', 'asc');
        res.json(withdrawals);
    } catch (error) {
        console.error("GET PENDING WITHDRAWALS ERROR:", error);
        res.status(500).json({ message: 'Error fetching pending withdrawals.' });
    }
};

exports.updateWithdrawalStatus = async (req, res) => {
    const { withdrawalId } = req.params;
    const { status } = req.body;
    const adminId = req.user.id;
    if (status !== 'FAILED') {
        return res.status(400).json({ message: 'Only FAILED status can be set manually.' });
    }
    try {
        await db.transaction(async trx => {
            const withdrawal = await trx('withdrawals').where({ id: withdrawalId, status: 'PENDING' }).first();
            if (!withdrawal) { throw new Error('Pending withdrawal not found.'); }
            await trx('withdrawals').where('id', withdrawalId).update({ status: 'FAILED' });
            await trx('users').where('id', withdrawal.user_id).increment('withdrawable_balance', withdrawal.amount);
            await logAdminActivity(adminId, 'WITHDRAWAL_REJECT', withdrawal.user_id, { withdrawalId, amount: withdrawal.amount }, trx);
        });
        res.json({ message: `Withdrawal #${withdrawalId} has been marked as FAILED and funds have been returned to the user.` });
    } catch (error) {
        console.error(`UPDATE WITHDRAWAL STATUS ERROR:`, error);
        res.status(500).json({ message: error.message || 'Failed to update withdrawal status.' });
    }
};

exports.getDepositTrackingHistory = async (req, res) => {
    try {
        const { search = '' } = req.query;
        const query = db('partial_deposits as pd')
            .join('users as u', 'pd.user_id', 'u.id')
            .select(
                'pd.id', 'u.email', 'pd.amount', 'pd.tx_hash as deposit_hash',
                'pd.sweep_status', 'pd.sweep_tx_hash', 'pd.created_at'
            )
            .orderBy('pd.created_at', 'desc').limit(100);
        if (search) {
            query.where('u.email', 'like', `%${search}%`);
        }
        const deposits = await query;
        res.json(deposits);
    } catch (e) {
        console.error("ADMIN GET DEPOSIT TRACKING ERROR:", e);
        res.status(500).json({ message: 'Server error fetching deposit tracking history' });
    }
};

exports.getP2PTransferHistory = async (req, res) => {
    try {
        const history = await db('fund_transfers as ft')
            .join('users as sender', 'ft.sender_id', 'sender.id')
            .join('users as recipient', 'ft.recipient_id', 'recipient.id')
            .select(
                'ft.id', 'sender.email as sender_email', 'recipient.email as recipient_email',
                'ft.amount', 'ft.created_at'
            )
            .orderBy('ft.created_at', 'desc').limit(100);
        res.json(history);
    } catch (error) {
        console.error("ADMIN GET P2P TRANSFER HISTORY ERROR:", error);
        res.status(500).json({ message: 'Failed to fetch P2P transfer history.' });
    }
};

exports.getP2PFeeHistory = async (req, res) => {
    try {
        const fees = await db('admin_earnings as ae')
            .join('users as u', 'ae.user_id', 'u.id')
            .where('ae.type', 'P2P_FEE')
            .select(
                'ae.id', 'u.email as from_user_email', 'ae.amount',
                'ae.notes', 'ae.created_at'
            )
            .orderBy('ae.created_at', 'desc').limit(100);
        res.json(fees);
    } catch (error) {
        console.error("ADMIN GET P2P FEE HISTORY ERROR:", error);
        res.status(500).json({ message: 'Failed to fetch P2P fee history.' });
    }
};

// ✅ NEW FUNCTION FOR PROMOTER PAYOUTS HISTORY
exports.getPromoterPayoutsHistory = async (req, res) => {
    try {
        const payouts = await db('admin_earnings as ae')
            .join('users as promoter', 'ae.sponsor_id', 'promoter.id')
            .join('users as from_user', 'ae.user_id', 'from_user.id')
            .whereIn('ae.type', ['PROMOTER_PAYOUT', 'PROMOTER_TEAM_PAYOUT'])
            .select(
                'ae.id',
                'promoter.email as promoter_email',
                'from_user.email as from_user_email',
                'ae.amount',
                'ae.type',
                'ae.created_at'
            )
            .orderBy('ae.created_at', 'desc').limit(100);
        res.json(payouts);
    } catch (error) {
        console.error("ADMIN GET PROMOTER PAYOUTS ERROR:", error);
        res.status(500).json({ message: 'Failed to fetch promoter payout history.' });
    }
};