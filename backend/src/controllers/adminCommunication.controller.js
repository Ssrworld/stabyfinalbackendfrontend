// backend/src/controllers/adminCommunication.controller.js (UPDATED FOR EMAIL QUEUE)

const db = require('../config/db.config');
const { sanitize } = require('../services/sanitizer.service');
const { createHtmlEmail } = require('../services/email.service');
const { logAdminActivity } = require('../services/adminActivity.service');

exports.createAnnouncement = async (req, res) => {
    const { subject, content, show_on_homepage } = req.body;
    const adminId = req.user.id;
    const sanitizedContent = sanitize(content);

    if (!subject || !sanitizedContent) {
        return res.status(400).json({ message: 'Subject and content are required.' });
    }

    const trx = await db.transaction();
    try {
        const announcementData = {
            admin_id: adminId,
            subject,
            content: sanitizedContent,
            show_on_homepage: (String(show_on_homepage).toLowerCase() === 'true'),
            status: 'PUBLISHED'
        };
        
        if (req.file) {
            announcementData.image_url = req.file.path;
        }

        const dbClient = db.client.config.client;
        let newAnnouncement;

        if (dbClient === 'pg' || dbClient === 'oracledb' || dbClient === 'mssql') {
            [newAnnouncement] = await trx('announcements').insert(announcementData).returning('*');
        } else {
            const [insertedId] = await trx('announcements').insert(announcementData);
            newAnnouncement = await trx('announcements').where('id', insertedId).first();
        }
        
        await logAdminActivity(adminId, 'ANNOUNCEMENT_CREATE', null, { id: newAnnouncement.id, subject }, trx);
        await trx.commit();
        
        res.status(201).json({ message: 'Announcement created successfully.', announcement: newAnnouncement });

    } catch (error) {
        await trx.rollback();
        console.error("CREATE ANNOUNCEMENT ERROR:", error);
        res.status(500).json({ message: 'Failed to create announcement.' });
    }
};

exports.getAnnouncements = async (req, res) => {
    try {
        const announcements = await db('announcements').orderBy('created_at', 'desc').limit(50);
        res.json(announcements);
    } catch (error) {
        console.error("GET ANNOUNCEMENTS ERROR:", error);
        res.status(500).json({ message: 'Failed to fetch announcements.' });
    }
};

exports.updateAnnouncementStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.user.id;

    if (!['PUBLISHED', 'ARCHIVED'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status.' });
    }
    
    const trx = await db.transaction();
    try {
        const updated = await trx('announcements').where({ id }).update({ status });
        if (updated) {
            await logAdminActivity(adminId, 'ANNOUNCEMENT_STATUS_UPDATE', null, { id, status }, trx);
            await trx.commit();
            res.json({ message: `Announcement status updated to ${status}.` });
        } else {
            await trx.rollback();
            res.status(404).json({ message: 'Announcement not found.' });
        }
    } catch (error) {
        await trx.rollback();
        console.error("UPDATE ANNOUNCEMENT STATUS ERROR:", error);
        res.status(500).json({ message: 'Failed to update announcement status.' });
    }
};

exports.deleteAnnouncement = async (req, res) => {
    const { id } = req.params;
    const adminId = req.user.id;

    const trx = await db.transaction();
    try {
        const deleted = await trx('announcements').where({ id }).del();
        if (deleted) {
            await logAdminActivity(adminId, 'ANNOUNCEMENT_DELETE', null, { id }, trx);
            await trx.commit();
            res.json({ message: 'Announcement deleted successfully.' });
        } else {
            await trx.rollback();
            res.status(404).json({ message: 'Announcement not found.' });
        }
    } catch (error) {
        await trx.rollback();
        console.error("DELETE ANNOUNCEMENT ERROR:", error);
        res.status(500).json({ message: 'Failed to delete announcement.' });
    }
};

/**
 * --- ✅ UPDATED FUNCTION ---
 * Queues a bulk email to all active users instead of sending directly.
 */
exports.sendBulkEmail = async (req, res) => {
    const { subject, content } = req.body;
    const adminId = req.user.id;
    const sanitizedContent = sanitize(content);
    if (!subject || !sanitizedContent) {
        return res.status(400).json({ message: 'Subject and content are required.' });
    }

    // Immediately respond to the admin to let them know the process has started.
    res.status(202).json({ message: 'Email queuing process has started. This may take a few moments.' });
    
    // Run the queuing process in the background.
    (async () => {
        try {
            const activeUsers = await db('users').where('status', 'ACTIVE').select('email');
            if (activeUsers.length === 0) {
                console.log('[Bulk Email] No active users found to queue emails for.');
                return;
            }

            console.log(`[Bulk Email] Queuing '${subject}' for ${activeUsers.length} active users.`);
            
            // Create the full HTML content once.
            const fullHtmlContent = createHtmlEmail(subject, sanitizedContent, subject);

            // Prepare all emails for a single bulk insert.
            const emailsToQueue = activeUsers.map(user => ({
                recipient_email: user.email,
                subject: subject,
                content_html: fullHtmlContent,
                status: 'PENDING'
            }));

            // Insert all emails into the queue in one go.
            await db('email_queue').insert(emailsToQueue);
            
            await logAdminActivity(adminId, 'BULK_EMAIL_QUEUED', null, { subject, queuedCount: activeUsers.length });
            console.log(`[Bulk Email] Process finished. Successfully queued emails for ${activeUsers.length} users.`);

        } catch (error) {
            console.error('[Bulk Email] CRITICAL ERROR: Could not queue bulk emails.', error);
            await logAdminActivity(adminId, 'BULK_EMAIL_FAILED', null, { subject, error: error.message });
        }
    })();
};

/**
 * --- ✅ NEW FUNCTION ---
 * Fetches the email queue for the admin report page.
 */
exports.getEmailQueue = async (req, res) => {
    try {
        const emails = await db('email_queue').orderBy('created_at', 'desc').limit(100);
        res.json(emails);
    } catch (error) {
        console.error("ADMIN GET EMAIL QUEUE ERROR:", error);
        res.status(500).json({ message: 'Failed to fetch email queue.' });
    }
};
