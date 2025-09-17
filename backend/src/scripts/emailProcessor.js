// backend/src/scripts/emailProcessor.js
const db = require('../config/db.config');
const { sendMail } = require('../services/email.service');

const MAX_ATTEMPTS = 5;

async function processEmailQueue() {
    const pendingEmails = await db('email_queue')
        .where('status', 'PENDING')
        .orWhere(function() {
            this.where('status', 'FAILED').andWhere('attempts', '<', MAX_ATTEMPTS);
        })
        .limit(20); // Process 20 emails per cycle

    if (pendingEmails.length === 0) {
        // console.log('[EmailProcessor] No emails to process.');
        return;
    }

    console.log(`[EmailProcessor] Found ${pendingEmails.length} emails to process.`);

    for (const email of pendingEmails) {
        try {
            await sendMail(email.recipient_email, email.subject, email.content_html);
            await db('email_queue').where('id', email.id).update({
                status: 'SENT',
                processed_at: new Date(),
                attempts: db.raw('attempts + 1')
            });
        } catch (error) {
            await db('email_queue').where('id', email.id).update({
                status: 'FAILED',
                last_error: error.message.substring(0, 1000), // Avoid overly long error messages
                processed_at: new Date(),
                attempts: db.raw('attempts + 1')
            });
            console.error(`[EmailProcessor] Failed to send email ID ${email.id} to ${email.recipient_email}. Error: ${error.message}`);
        }
    }
}

module.exports = { processEmailQueue };
