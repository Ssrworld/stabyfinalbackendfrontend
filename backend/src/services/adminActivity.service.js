// backend/src/services/adminActivity.service.js
const db = require('../config/db.config');

/**
 * Logs an administrative action to the database.
 * @param {number} adminId - The ID of the admin performing the action.
 * @param {string} actionType - The type of action (e.g., 'USER_UPDATE').
 * @param {number|null} targetUserId - The ID of the user being affected.
 * @param {object|null} details - An object containing details about the action.
 * @param {import("knex").Knex.Transaction} [trx] - Optional Knex transaction object.
 */
const logAdminActivity = async (adminId, actionType, targetUserId = null, details = null, trx) => {
    const queryBuilder = trx || db;
    try {
        await queryBuilder('admin_activity_logs').insert({
            admin_id: adminId,
            action_type: actionType,
            target_user_id: targetUserId,
            details: details ? JSON.stringify(details) : null
        });
    } catch (error) {
        console.error(`[ActivityLog] Failed to log admin activity: ${actionType}`, error);
        // Do not throw error here to not interrupt the main process
    }
};

module.exports = { logAdminActivity };