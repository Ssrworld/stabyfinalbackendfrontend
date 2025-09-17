// backend/src/controllers/promoter.controller.js (A-to-Z CODE WITH TEAM SIZE CALCULATION)

const db = require('../config/db.config');

const ensureIsPromoter = async (req, res, next) => {
    try {
        const user = await db('users').where('id', req.user.id).first('role');
        if (user && user.role === 'PROMOTER') {
            next();
        } else {
            res.status(403).json({ message: 'Forbidden: Promoter access only.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error verifying user role.' });
    }
};

// ✅✅✅ START: टीम के आकार की गणना करने के लिए नया फंक्शन ✅✅✅
/**
 * Recursively counts the size of a user's referral downline (excluding the user themselves).
 * This function uses a raw SQL query with a Recursive Common Table Expression (CTE) for performance.
 * @param {number} promoterId - The ID of the promoter.
 * @returns {Promise<number>} - The total number of users in the downline.
 */
async function getReferralTeamSize(promoterId) {
    // This query finds all users referred by the promoter, and then all users referred by them, and so on.
    const query = `
        WITH RECURSIVE referral_downline AS (
            -- Anchor: Start with the promoter's direct referrals
            SELECT id, referred_by FROM users WHERE referred_by = ?
            UNION ALL
            -- Recursive step: Find users referred by the people already in the downline
            SELECT u.id, u.referred_by
            FROM users u
            INNER JOIN referral_downline rd ON u.referred_by = rd.id
        )
        SELECT COUNT(*) as team_size FROM referral_downline;
    `;
    
    try {
        const result = await db.raw(query, [promoterId]);
        // The result structure can vary between DB drivers (pg vs mysql2)
        // This handles both cases safely.
        if (db.client.config.client === 'pg') {
            return parseInt(result.rows[0].team_size, 10) || 0;
        } else {
            return parseInt(result[0][0].team_size, 10) || 0;
        }
    } catch (error) {
        console.error(`Failed to calculate team size for promoter ${promoterId}`, error);
        return 0; // Return 0 on error
    }
}
// ✅✅✅ END: नया फंक्शन ✅✅✅


exports.getPromoterStats = [ensureIsPromoter, async (req, res) => {
    const promoterId = req.user.id;
    try {
        // --- मौजूदा गणनाएं ---
        const usdtCommissionResult = await db('promoter_commissions').where('promoter_id', promoterId).sum('commission_amount as total').first();
        const totalUsdtCommission = parseFloat(usdtCommissionResult.total || 0);

        const stblCommissionResult = await db('promoter_commissions').where('promoter_id', promoterId).sum('token_commission_amount as total').first();
        const totalStblCommission = parseFloat(stblCommissionResult.total || 0);

        const milestonesSetting = await db('system_settings').where('setting_key', 'promoter_milestones_config').first();
        const milestonesConfig = JSON.parse(milestonesSetting?.setting_value || '{}');

        // ✅✅✅ START: नई गणना को यहाँ कॉल करें ✅✅✅
        const totalTeamSize = await getReferralTeamSize(promoterId);
        // ✅✅✅ END: नई गणना ✅✅✅

        res.json({
            totalUsdtCommission: totalUsdtCommission.toFixed(2),
            totalStblCommission: totalStblCommission.toFixed(4),
            totalTeamSize, // <-- नई जानकारी को प्रतिक्रिया में जोड़ें
            milestonesConfig
        });
    } catch (error) {
        console.error(`PROMOTER STATS ERROR for ID ${promoterId}:`, error);
        res.status(500).json({ message: 'Failed to fetch promoter statistics.' });
    }
}];

exports.getPromoterCommissions = [ensureIsPromoter, async (req, res) => {
    const promoterId = req.user.id;
    try {
        const commissions = await db('promoter_commissions as pc')
            .join('users as u', 'pc.from_user_id', 'u.id')
            .where('pc.promoter_id', promoterId)
            .select(
                'pc.id',
                'u.email as from_user_email',
                'pc.commission_amount',
                'pc.token_commission_amount',
                'pc.commission_type',
                'pc.created_at'
            )
            .orderBy('pc.created_at', 'desc')
            .limit(100);

        res.json(commissions);
    } catch (error) {
        console.error(`PROMOTER COMMISSIONS ERROR for ID ${promoterId}:`, error);
        res.status(500).json({ message: 'Failed to fetch promoter commission history.' });
    }
}];