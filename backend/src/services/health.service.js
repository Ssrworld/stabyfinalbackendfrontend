// backend/src/services/health.service.js
const db = require('../config/db.config');

/**
 * Records a health check status for a given service.
 * It will update the existing record or create a new one.
 * @param {string} serviceName - The name of the service (e.g., 'POOL_ENGINE').
 * @param {'OK' | 'ERROR'} status - The status of the run.
 * @param {string} [details=''] - Optional details, especially for errors.
 */
const recordHealthCheck = async (serviceName, status, details = '') => {
    try {
        const record = {
            service_name: serviceName,
            status,
            details: details.substring(0, 500), // त्रुटि संदेश को छोटा करें
            last_run_timestamp: new Date()
        };
        // UPSERT logic: Insert if not exists, update if it does.
        await db('system_health_checks')
            .insert(record)
            .onConflict('service_name')
            .merge();
        
    } catch (error) {
        console.error(`[HealthService] Failed to record health check for ${serviceName}:`, error);
    }
};

module.exports = { recordHealthCheck };