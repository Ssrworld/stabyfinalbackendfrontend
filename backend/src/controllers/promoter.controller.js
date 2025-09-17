// backend/src/controllers/promoter.controller.js (UPDATED FOR TEAM-BASED MILESTONES)

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

/**
 * ✅ NEW FUNCTION: Recursively counts the total ACTIVE members in a user's referral downline.
 * @param {number} promoterId - The ID of the promoter.
 * @returns {Promise<number>} - The total number of active users in the downline.
 */
async function getActiveReferralTeamSize(promoterId) {
    const query = `
        WITH RECURSIVE referral_downline AS (
            SELECT id, referred_by, status FROM users WHERE referred_by = ?
            UNION ALL
            SELECT u.id, u.referred_by, u.status
            FROM users u
            INNER JOIN referral_downline rd ON u.referred_by = rd.id
        )
        SELECT COUNT(*) as team_size FROM referral_downline WHERE status = 'ACTIVE';
    `;
    
    try {
        const result = await db.raw(query, [promoterId]);
        if (db.client.config.client === 'pg') {
            return parseInt(result.rows[0].team_size, 10) || 0;
        } else {
            return parseInt(result[0][0].team_size, 10) || 0;
        }
    } catch (error) {
        console.error(`Failed to calculate active team size for promoter ${promoterId}`, error);
        return 0;
    }
}

// ✅ UPDATED CONTROLLER FUNCTION
exports.getPromoterStats = [ensureIsPromoter, async (req, res) => {
    const promoterId = req.user.id;
    try {
        // --- Existing Calculations ---
        const usdtCommissionResult = await db('promoter_commissions').where('promoter_id', promoterId).sum('commission_amount as total').first();
        const totalUsdtCommission = parseFloat(usdtCommissionResult.total || 0);

        const stblCommissionResult = await db('promoter_commissions').where('promoter_id', promoterId).sum('token_commission_amount as total').first();
        const totalStblCommission = parseFloat(stblCommissionResult.total || 0);

        const milestonesSetting = await db('system_settings').where('setting_key', 'promoter_milestones_config').first();
        const milestonesConfig = JSON.parse(milestonesSetting?.setting_value || '{}');
        
        // --- ✅ NEW CALCULATION FOR MILESTONES ---
        // We calculate both direct active and total active team size
        const { directActiveReferrals } = await db('users').where({ referred_by: promoterId, status: 'ACTIVE' }).count('* as directActiveReferrals').first();
        const totalActiveTeamSize = await getActiveReferralTeamSize(promoterId);

        res.json({
            totalUsdtCommission: totalUsdtCommission.toFixed(2),
            totalStblCommission: totalStblCommission.toFixed(4),
            directActiveReferralsCount: parseInt(directActiveReferrals, 10) || 0, // This can be used for other stats if needed
            totalActiveTeamSize: totalActiveTeamSize, // THIS IS THE NEW VALUE FOR MILESTONES
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