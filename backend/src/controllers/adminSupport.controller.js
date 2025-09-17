// backend/src/controllers/adminSupport.controller.js

const db = require('../config/db.config');
const { sanitize } = require('../services/sanitizer.service');

exports.getOpenTicketsCount = async (req, res) => {
    try {
        const { count } = await db('support_tickets').where('status', 'OPEN').count('* as count').first();
        res.json({ count: parseInt(count, 10) || 0 });
    } catch (error) {
        console.error("ADMIN GET OPEN TICKETS COUNT ERROR:", error);
        res.status(500).json({ message: 'Failed to get open tickets count.' });
    }
};

exports.getAllTickets = async (req, res) => {
    try {
        const tickets = await db('support_tickets')
            .join('users', 'support_tickets.user_id', 'users.id')
            .select('support_tickets.*', 'users.email')
            .orderBy('support_tickets.updated_at', 'desc');
        res.json(tickets);
    } catch (error) {
        console.error("ADMIN GET ALL TICKETS ERROR:", error);
        res.status(500).json({ message: 'Failed to fetch tickets.' });
    }
};

exports.getTicketByIdForAdmin = async (req, res) => {
    try {
        const ticket = await db('support_tickets').where({ id: req.params.id }).first();
        if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
        const replies = await db('ticket_replies')
            .join('users', 'ticket_replies.user_id', 'users.id')
            .where({ ticket_id: req.params.id })
            .select('ticket_replies.*', 'users.email')
            .orderBy('created_at', 'asc');
        const parsedReplies = replies.map(reply => {
            if (reply.attachment && typeof reply.attachment === 'string') {
                try { reply.attachment = JSON.parse(reply.attachment); }
                catch (e) { reply.attachment = null; }
            }
            return reply;
        });
        res.json({ ticket, replies: parsedReplies });
    } catch (error) {
        console.error("ADMIN GET TICKET BY ID ERROR:", error);
        res.status(500).json({ message: 'Failed to fetch ticket details.' });
    }
};

exports.createTicketReply = async (req, res) => {
    let { message } = req.body;
    const { id: ticketId } = req.params;
    const adminId = req.user.id;
    message = sanitize(message);
    let attachmentData = null;
    if (req.file) {
        attachmentData = { type: req.file.mimetype.startsWith('video') ? 'video' : 'image', url: req.file.path, public_id: req.file.filename };
    }
    if (!message && !attachmentData) {
        return res.status(400).json({ message: 'Reply must have a message or an attachment.' });
    }
    try {
        await db('ticket_replies').insert({ ticket_id: ticketId, user_id: adminId, message: message || '', attachment: attachmentData ? JSON.stringify(attachmentData) : null });
        await db('support_tickets').where({ id: ticketId }).update({ status: 'ANSWERED', updated_at: new Date() });
        res.status(201).json({ message: 'Admin reply added successfully.' });
    } catch (error) {
        console.error("ADMIN CREATE REPLY ERROR:", error);
        res.status(500).json({ message: 'Failed to add reply.' });
    }
};

exports.updateTicketStatus = async (req, res) => {
    const { status } = req.body;
    const { id: ticketId } = req.params;
    const validStatuses = ['OPEN', 'ANSWERED', 'CLOSED'];
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status provided.' });
    }
    try {
        const updatedRows = await db('support_tickets').where({ id: ticketId }).update({ status: status, updated_at: new Date() });
        if(updatedRows > 0) {
            res.json({ message: `Ticket status successfully updated to ${status}.` });
        } else {
            res.status(404).json({ message: 'Ticket not found.' });
        }
    } catch (error) {
        console.error("ADMIN UPDATE STATUS ERROR:", error);
        res.status(500).json({ message: 'Failed to update ticket status.' });
    }
};