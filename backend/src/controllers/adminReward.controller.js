// backend/src/controllers/adminReward.controller.js

const db = require('../config/db.config');
const { logAdminActivity } = require('../services/adminActivity.service');

exports.getStblRewards = async (req, res) => {
    try {
        const rewards = await db('stbl_token_rewards as str')
            .join('users as u', 'str.user_id', 'u.id')
            .select(
                'str.id', 'str.user_id', 'u.email', 'str.amount', 
                'str.status', 'str.payout_wallet_address', 'str.tx_hash', 
                'str.created_at', 'str.updated_at'
            )
            .orderBy('str.created_at', 'desc');
        res.json(rewards);
    } catch (error) {
        console.error("GET STBL REWARDS ERROR:", error);
        res.status(500).json({ message: 'Failed to fetch STBL rewards.' });
    }
};

exports.updateStblRewardStatus = async (req, res) => {
    const { rewardId } = req.params;
    const { status, txHash } = req.body;
    const adminId = req.user.id;
    if (!['TRANSFERRED', 'FAILED'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status provided.' });
    }
    if (status === 'TRANSFERRED' && !txHash) {
        return res.status(400).json({ message: 'Transaction Hash is required for transferred status.' });
    }
    try {
        await db.transaction(async trx => {
            const updatedRows = await trx('stbl_token_rewards')
                .where({ id: rewardId, status: 'PENDING_TRANSFER' })
                .update({
                    status: status,
                    tx_hash: txHash || null,
                    updated_at: new Date()
                });
            if (updatedRows === 0) {
                throw new Error('Reward not found or not in a pending state.');
            }
            await logAdminActivity(adminId, 'STBL_REWARD_UPDATE', null, { rewardId, newStatus: status }, trx);
        });
        res.json({ message: `Reward status successfully updated to ${status}.` });
    } catch (error) {
        console.error("UPDATE STBL REWARD STATUS ERROR:", error);
        res.status(500).json({ message: error.message || 'Failed to update reward status.' });
    }
};