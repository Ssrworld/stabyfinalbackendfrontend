const db = require('../config/db.config');

exports.getPublicStats = async (req, res) => {
    try {
        const { totalMembers } = await db('users').where('status', 'ACTIVE').count('* as totalMembers').first();
        const { totalRewards } = await db('users').sum('total_earnings as totalRewards').first();

        const stats = {
            totalMembers: totalMembers || 0,
            totalRewards: parseFloat(totalRewards || 0).toFixed(2),
        };
        res.json(stats);
    } catch (error) {
        console.error("PUBLIC STATS ERROR:", error);
        res.status(500).json({ message: 'Error fetching system statistics.' });
    }
};