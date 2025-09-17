// backend/src/controllers/promoter.controller.js (UPDATED TO INCLUDE SPONSOR EMAIL)

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

async function getActiveReferralTeamSize(promoterId) {
    const query = `
        WITH RECURSIVE referral_downline AS (
            SELECT id FROM users WHERE referred_by = ?
            UNION ALL
            SELECT u.id FROM users u
            INNER JOIN referral_downline rd ON u.referred_by = rd.id
        )
        SELECT COUNT(*) as team_size FROM referral_downline rd
        JOIN users u ON u.id = rd.id WHERE u.status = 'ACTIVE';
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

exports.getPromoterStats = [ensureIsPromoter, async (req, res) => {
    const promoterId = req.user.id;
    try {
        const usdtCommissionResult = await db('promoter_commissions').where('promoter_id', promoterId).sum('commission_amount as total').first();
        const totalUsdtCommission = parseFloat(usdtCommissionResult.total || 0);

        const stblCommissionResult = await db('promoter_commissions').where('promoter_id', promoterId).sum('token_commission_amount as total').first();
        const totalStblCommission = parseFloat(stblCommissionResult.total || 0);

        const milestonesSetting = await db('system_settings').where('setting_key', 'promoter_milestones_config').first();
        const milestonesConfig = JSON.parse(milestonesSetting?.setting_value || '{}');
        
        const { directActiveReferrals } = await db('users').where({ referred_by: promoterId, status: 'ACTIVE' }).count('* as directActiveReferrals').first();
        const totalActiveTeamSize = await getActiveReferralTeamSize(promoterId);

        res.json({
            totalUsdtCommission: totalUsdtCommission.toFixed(2),
            totalStblCommission: totalStblCommission.toFixed(4),
            directActiveReferralsCount: parseInt(directActiveReferrals, 10) || 0,
            totalActiveTeamSize: totalActiveTeamSize,
            milestonesConfig
        });
    } catch (error) {
        console.error(`PROMOTER STATS ERROR for ID ${promoterId}:`, error);
        res.status(500).json({ message: 'Failed to fetch promoter statistics.' });
    }
}];


// ✅✅✅ THIS IS THE UPDATED FUNCTION ✅✅✅
exports.getPromoterCommissions = [ensureIsPromoter, async (req, res) => {
    const promoterId = req.user.id;
    try {
        const commissions = await db('promoter_commissions as pc')
            // Join to get the new user's email ('From User')
            .join('users as from_user', 'pc.from_user_id', 'from_user.id')
            // Left Join to get the sponsor's email
            .leftJoin('users as sponsor', 'from_user.referred_by', 'sponsor.id')
            .where('pc.promoter_id', promoterId)
            .select(
                'pc.id',
                'from_user.email as from_user_email',
                'sponsor.email as sponsor_email', // <-- ADD THIS LINE
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