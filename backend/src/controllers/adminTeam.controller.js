// backend/src/controllers/adminTeam.controller.js

const db = require('../config/db.config');
const { findNextAvailableSponsorForPool1 } = require('../services/poolEngine.service');

exports.getUserMatrix = async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await db('users')
            .where('id', userId)
            .select('id', 'email', 'current_pool', 'original_sponsor_id', 'referred_by', 'global_placement_id')
            .first();

        if (!user) return res.status(404).json({ message: 'User not found.' });

        let parent = null;
        if (user.original_sponsor_id) {
            parent = await db('users')
                .where('id', user.original_sponsor_id)
                .select('id', 'email')
                .first();
        }

        const children = await db('users')
            .where('original_sponsor_id', userId)
            .select('id', 'email', 'current_pool', 'referred_by', 'global_placement_id');

        const detailedChildren = await Promise.all(children.map(async (child) => {
            const hasChildrenResult = await db('users').where('original_sponsor_id', child.id).first();
            return {
                ...child,
                type: child.referred_by === parseInt(userId, 10) ? 'Direct' : 'Spillover',
                hasChildren: !!hasChildrenResult
            };
        }));

        res.json({ user, parent, children: detailedChildren });
    } catch (error) {
        console.error(`ADMIN GET MATRIX ERROR for ID ${userId}:`, error);
        res.status(500).json({ message: 'Error fetching user matrix details.' });
    }
};

exports.getNextAvailableSlot = async (req, res) => {
    try {
        const sponsorId = await db.transaction(trx => findNextAvailableSponsorForPool1(trx));
        if (sponsorId) {
            const sponsor = await db('users').where('id', sponsorId).select('id', 'email').first();
            res.json({ nextSponsor: sponsor });
        } else {
            res.json({ nextSponsor: null, message: 'No available slots found.' });
        }
    } catch (error) {
        console.error("GET NEXT SLOT ERROR:", error);
        res.status(500).json({ message: 'Error finding next available slot.' });
    }
};

exports.getUnplacedQueue = async (req, res) => {
    try {
        const queue = await db('users')
            .where({ status: 'ACTIVE', original_sponsor_id: null, current_pool: 1 })
            .whereNotIn('id', [1, 2])
            .orderBy('created_at', 'asc').limit(10).select('id', 'email', 'created_at');
        res.json({ queue });
    } catch (error) {
        console.error("GET UNPLACED QUEUE ERROR:", error);
        res.status(500).json({ message: 'Error fetching unplaced user queue.' });
    }
};