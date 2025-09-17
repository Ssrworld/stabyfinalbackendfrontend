// backend/src/controllers/adminUser.controller.js (A-to-Z CODE WITH PROMOTER ROLE ADDED)

const db = require('../config/db.config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { logAdminActivity } = require('../services/adminActivity.service');

exports.getAllUsers = async (req, res) => {
    try {
        const searchTerm = req.query.search || '';
        const filter = req.query.filter || 'ALL';
        
        const page = parseInt(req.query.page, 10) || 1;
        const limit = 50;
        const offset = (page - 1) * limit;

        const baseQuery = db('users as u');

        if (searchTerm) {
            const searchInt = parseInt(searchTerm) || 0;
            baseQuery.where(function() {
                this.where('u.email', 'like', `%${searchTerm}%`).orWhere('u.id', '=', searchInt);
            });
        }
        if (filter === 'ACTIVE') {
            baseQuery.where({ 'u.status': 'ACTIVE', 'u.is_suspended': false });
        } else if (filter === 'PENDING') {
            baseQuery.whereNot('u.status', 'ACTIVE').andWhere('u.is_suspended', false);
        } else if (filter === 'SUSPENDED') {
            baseQuery.where('u.is_suspended', true);
        }

        const totalResult = await baseQuery.clone().count('* as total').first();
        const totalUsers = parseInt(totalResult.total, 10);
        const totalPages = Math.ceil(totalUsers / limit);

        const users = await baseQuery
            .leftJoin('users as referrer', 'u.referred_by', 'referrer.id')
            .select(
                'u.id', 'u.email', 'u.mobile_number', 'u.status', 'u.is_suspended', 'u.current_pool', 
                'u.global_placement_id', 'u.created_at as registration_timestamp', 'u.activation_timestamp',
                'referrer.email as referrer_email',
                'u.total_earnings', 'u.withdrawable_balance', 'u.main_balance',
                'u.role', // ✅✅✅ यह लाइन यहाँ जोड़ी गई है ✅✅✅
                db.raw('(SELECT COUNT(*) FROM users AS refs WHERE refs.referred_by = u.id) as direct_referrals_count'),
                db.raw('(SELECT COUNT(*) FROM users AS downline WHERE downline.original_sponsor_id = u.id) as downline_count')
            )
            .orderBy('u.id', 'desc')
            .limit(limit)
            .offset(offset);
        
        res.json({
            users,
            pagination: {
                total: totalUsers,
                page,
                limit,
                totalPages
            }
        });

    } catch (e) { 
        console.error("ADMIN GET USERS ERROR:", e);
        res.status(500).json({ message: 'Server error fetching users', error: e.message }); 
    }
};

exports.exportAllUsers = async (req, res) => {
    const searchTerm = req.query.search || '';
    try {
        let baseQuery = db('users as u').leftJoin('users as referrer', 'u.referred_by', 'referrer.id');
        if (searchTerm) {
            const searchInt = parseInt(searchTerm) || 0;
            baseQuery.where(function() {
                this.where('u.email', 'like', `%${searchTerm}%`).orWhere('u.id', '=', searchInt);
            });
        }
        
        const users = await baseQuery
            .select(
                'u.id', 'u.email', 'u.mobile_number', 'u.status', 'u.is_suspended', 'u.current_pool', 
                'u.total_earnings', 'u.withdrawable_balance', 'u.main_balance',
                'u.payout_wallet', 'u.created_at as registration_timestamp', 'u.activation_timestamp',
                'u.global_placement_id', 'referrer.email as referrer_email',
                'u.role', // Also added here for consistency
                db.raw('(SELECT COUNT(*) FROM users AS refs WHERE refs.referred_by = u.id) as direct_referrals_count'),
                db.raw('(SELECT COUNT(*) FROM users AS downline WHERE downline.original_sponsor_id = u.id) as downline_count')
            )
            .orderBy('u.id', 'asc');

        const headers = [
            "ID", "Placement ID", "Email", "Role", "Mobile Number", "Status", "Is Suspended", "Current Pool", "Direct Refs", "Downline",
            "Referred By", "Total Earnings", "Withdrawable Balance", "Main Balance",
            "Payout Wallet", "Registered On", "Activated On"
        ];
        const rows = users.map(user => [
            user.id, user.global_placement_id || 'N/A', user.email, user.role, user.mobile_number || 'N/A', user.status, user.is_suspended, user.current_pool,
            user.direct_referrals_count, user.downline_count, user.referrer_email || 'N/A',
            user.total_earnings, user.withdrawable_balance, user.main_balance,
            user.payout_wallet || 'Not Set', 
            new Date(user.registration_timestamp).toISOString(),
            user.activation_timestamp ? new Date(user.activation_timestamp).toISOString() : 'N/A',
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));

        const csvString = [headers.join(','), ...rows].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="stabylink_users_export.csv"');
        res.status(200).send(csvString);

    } catch (e) {
        console.error("ADMIN EXPORT USERS ERROR:", e);
        res.status(500).json({ message: 'Server error exporting users', error: e.message });
    }
};

exports.getUserDetails = async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await db('users as u')
            .leftJoin('users as sponsor', 'u.original_sponsor_id', 'sponsor.id')
            .where('u.id', userId)
            .select(
                'u.*', 
                'sponsor.email as sponsor_email',
                db.raw('(SELECT COUNT(*) FROM users AS refs WHERE refs.referred_by = u.id) as direct_referrals_count'),
                db.raw('(SELECT COUNT(*) FROM users AS downline WHERE downline.original_sponsor_id = u.id) as downline_count')
            )
            .first();

        if (!user) return res.status(404).json({ message: 'User not found.' });
        
        delete user.password_hash;
        delete user.otp;
        delete user.otp_expires;
        delete user.encrypted_mnemonic;
        
        res.json(user);
    } catch (error) {
        console.error(`ADMIN GET USER DETAILS ERROR for ID ${userId}:`, error);
        res.status(500).json({ message: 'Error fetching user details.' });
    }
};

exports.updateUserDetails = async (req, res) => {
    const { userId } = req.params;
    const { email, mobile_number, status, is_suspended } = req.body;
    const adminId = req.user.id;
    
    try {
        const userBefore = await db('users').where({ id: userId }).first();
        if (!userBefore) return res.status(404).json({ message: 'User not found.' });
        const updateData = {};
        const changes = {};

        if (email && email !== userBefore.email) { updateData.email = email; changes.email = { old: userBefore.email, new: email }; }
        if (mobile_number && mobile_number !== userBefore.mobile_number) { updateData.mobile_number = mobile_number; changes.mobile_number = { old: userBefore.mobile_number, new: mobile_number }; }
        if (status && status !== userBefore.status) { updateData.status = status; changes.status = { old: userBefore.status, new: status }; }
        if (is_suspended !== undefined && is_suspended !== userBefore.is_suspended) { updateData.is_suspended = is_suspended; changes.is_suspended = { old: userBefore.is_suspended, new: is_suspended }; }

        if (Object.keys(updateData).length === 0) { return res.status(400).json({ message: 'No fields to update provided.' }); }
        
        await db.transaction(async trx => {
            await trx('users').where({ id: userId }).update(updateData);
            await logAdminActivity(adminId, 'USER_UPDATE', userId, { changes }, trx);
        });
        
        res.json({ message: 'User details updated successfully.' });
    } catch (error) {
        console.error(`ADMIN UPDATE USER ERROR for ID ${userId}:`, error);
        if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') { return res.status(409).json({ message: 'Email or mobile number is already in use.' }); }
        res.status(500).json({ message: 'Error updating user details.' });
    }
};

exports.changeUserSponsor = async (req, res) => {
    const { userId } = req.params;
    const { newSponsorEmail } = req.body;
    const adminId = req.user.id;

    if (!newSponsorEmail) {
        return res.status(400).json({ message: 'New sponsor email is required.' });
    }

    try {
        await db.transaction(async trx => {
            const targetUser = await trx('users').where('id', userId).first();
            const newSponsor = await trx('users').where('email', newSponsorEmail).first();

            if (!targetUser) throw new Error('Target user not found.');
            if (!newSponsor) throw new Error(`Sponsor with email ${newSponsorEmail} not found.`);
            if (targetUser.id === newSponsor.id) throw new Error('A user cannot sponsor themselves.');
            if (targetUser.referred_by !== 1) throw new Error('This user was not referred by the system. Sponsor can only be changed for system-referred users.');
            if (newSponsor.status !== 'ACTIVE') throw new Error('The new sponsor must be an active user.');

            const COMMISSION_AMOUNT = 5.0;

            await trx('users').where('id', userId).update({ referred_by: newSponsor.id });
            await trx('users').where('id', newSponsor.id).increment({ 'withdrawable_balance': COMMISSION_AMOUNT, 'total_earnings': COMMISSION_AMOUNT });
            await trx('admin_earnings').insert({
                user_id: userId, sponsor_id: 1, amount: -COMMISSION_AMOUNT,
                type: 'DIRECT_REFERRAL', pool_level: 0, notes: `Reversal for sponsor change to user ${newSponsor.id}`
            });
            await trx('admin_earnings').insert({
                user_id: userId, sponsor_id: newSponsor.id, amount: -COMMISSION_AMOUNT,
                type: 'DIRECT_REFERRAL', pool_level: 0
            });
            await logAdminActivity(adminId, 'SPONSOR_CHANGE', userId, {
                oldSponsorId: 1, newSponsorId: newSponsor.id, commissionAdjusted: COMMISSION_AMOUNT
            }, trx);
        });
        res.json({ message: `Successfully changed sponsor for user ID ${userId} to ${newSponsorEmail} and adjusted commission.` });
    } catch (error) {
        console.error(`SPONSOR CHANGE ERROR by Admin ID ${adminId}:`, error);
        res.status(400).json({ message: error.message || 'Failed to change sponsor.' });
    }
};

exports.adminResetPassword = async (req, res) => {
    const { userId } = req.params;
    const { newPassword } = req.body;
    const adminId = req.user.id;
    if (!newPassword || newPassword.length < 8) { return res.status(400).json({ message: 'New password must be at least 8 characters long.' }); }
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.transaction(async trx => {
            const updatedRows = await trx('users').where('id', userId).update({ password_hash: hashedPassword });
            if (updatedRows === 0) { throw new Error('User not found.'); }
            await logAdminActivity(adminId, 'ADMIN_PASSWORD_RESET', userId, { newPasswordLength: newPassword.length }, trx);
        });
        res.json({ message: "User's password has been successfully reset." });
    } catch (error) {
        console.error(`ADMIN PASSWORD RESET ERROR for User ID ${userId}:`, error);
        res.status(500).json({ message: error.message || 'Failed to reset password.' });
    }
};

exports.generateImpersonationToken = async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await db('users').where({ id: userId }).first('id', 'email');
        if (!user) return res.status(404).json({ message: 'User not found.' });
        
        const impersonationToken = jwt.sign({ id: user.id, email: user.email, impersonating: true }, process.env.JWT_SECRET, { expiresIn: '5m' });
        await logAdminActivity(req.user.id, 'USER_IMPERSONATE', userId);
        res.json({ token: impersonationToken });
    } catch (error) {
        console.error(`ADMIN IMPERSONATE ERROR for ID ${userId}:`, error);
        res.status(500).json({ message: 'Failed to generate impersonation token.' });
    }
};

exports.creditUserFunds = async (req, res) => {
    const { userId, amount, reason } = req.body;
    const adminId = req.user.id;
    const creditAmount = parseFloat(amount);
    if (!userId || !creditAmount || creditAmount <= 0 || !reason || reason.length > 255) { return res.status(400).json({ message: 'User ID, a valid positive amount, and a reason (max 255 chars) are required.' }); }
    try {
        await db.transaction(async trx => {
            const updatedRows = await trx('users').where('id', userId).increment('main_balance', creditAmount);
            if (updatedRows === 0) throw new Error('User not found.');
            await trx('admin_transactions').insert({ admin_id: adminId, user_id: userId, amount: creditAmount, type: 'CREDIT', reason: reason });
            await logAdminActivity(adminId, 'FUNDS_CREDIT', userId, { amount: creditAmount, reason }, trx);
        });
        res.json({ message: `$${creditAmount.toFixed(2)} successfully credited to user ID ${userId}.` });
    } catch (error) {
        console.error(`ADMIN CREDIT ERROR by Admin ID ${adminId}:`, error);
        res.status(400).json({ message: error.message || 'Failed to credit funds.' });
    }
};

exports.debitUserFunds = async (req, res) => {
    const { userId, amount, reason } = req.body;
    const adminId = req.user.id;
    const debitAmount = parseFloat(amount);
    if (!userId || !debitAmount || debitAmount <= 0 || !reason || reason.length > 255) { return res.status(400).json({ message: 'User ID, a valid positive amount, and a reason (max 255 chars) are required.' }); }
    try {
        await db.transaction(async trx => {
            const user = await trx('users').where('id', userId).first('main_balance');
            if (!user) throw new Error('User not found.');
            if (parseFloat(user.main_balance) < debitAmount) { throw new Error('Debit amount exceeds user\'s main balance.'); }
            await trx('users').where('id', userId).decrement('main_balance', debitAmount);
            await trx('admin_transactions').insert({ admin_id: adminId, user_id: userId, amount: debitAmount, type: 'DEBIT', reason: reason });
            await logAdminActivity(adminId, 'FUNDS_DEBIT', userId, { amount: debitAmount, reason }, trx);
        });
        res.json({ message: `$${debitAmount.toFixed(2)} successfully debited from user ID ${userId}.` });
    } catch (error) {
        console.error(`ADMIN DEBIT ERROR by Admin ID ${adminId}:`, error);
        res.status(400).json({ message: error.message || 'Failed to debit funds.' });
    }
};

exports.setUserRole = async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;
    const adminId = req.user.id;

    const validRoles = ['USER', 'PROMOTER'];

    if (!role || !validRoles.includes(role)) {
        return res.status(400).json({ message: 'A valid role (USER or PROMOTER) is required.' });
    }

    if (parseInt(userId, 10) <= 2) {
        return res.status(403).json({ message: 'Cannot change the role of system-critical users.' });
    }

    try {
        await db.transaction(async trx => {
            const user = await trx('users').where('id', userId).first();
            if (!user) {
                throw new Error('User not found.');
            }

            if (user.role === role) {
                throw new Error(`User is already a ${role}.`);
            }

            await trx('users').where('id', userId).update({ role: role });

            await logAdminActivity(adminId, 'USER_ROLE_CHANGE', userId, {
                oldRole: user.role,
                newRole: role
            }, trx);
        });

        res.json({ message: `User role successfully updated to ${role}.` });

    } catch (error) {
        console.error(`SET USER ROLE ERROR for User ID ${userId}:`, error);
        res.status(400).json({ message: error.message || 'Failed to update user role.' });
    }
};