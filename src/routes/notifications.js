/**
 * notifications.js
 * GET   /api/notifications         — list unread notifications for the user
 * PATCH /api/notifications/:id     — mark a single notification as read
 * PATCH /api/notifications/read-all — mark all as read
 */
'use strict';

const router = require('express').Router();
const supabase = require('../lib/supabaseClient');
const verifyJWT = require('../middleware/verifyJWT');

/**
 * GET /api/notifications
 * Query: ?limit=20&offset=0&status=unread
 */
router.get('/', verifyJWT, async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit ?? '20', 10), 50);
    const offset = parseInt(req.query.offset ?? '0', 10);
    const status = req.query.status ?? 'unread';

    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('id, event_type, title, body, channel, priority, status, created_at')
            .eq('user_id', req.user.id)
            .eq('status', status)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return res.json({ notifications: data ?? [] });
    } catch (err) {
        console.error('[notifications GET]', err.message);
        return res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

/**
 * PATCH /api/notifications/:id
 * Marks a single notification as read.
 */
router.patch('/:id', verifyJWT, async (req, res) => {
    const { id } = req.params;

    try {
        const { error } = await supabase
            .from('notifications')
            .update({ status: 'read', read_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', req.user.id); // RLS + explicit filter — belt-and-suspenders

        if (error) throw error;
        return res.json({ status: 'read', id });
    } catch (err) {
        console.error('[notifications PATCH]', err.message);
        return res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

/**
 * PATCH /api/notifications/read-all
 * Marks ALL unread notifications for the user as read.
 */
router.patch('/read-all', verifyJWT, async (req, res) => {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ status: 'read', read_at: new Date().toISOString() })
            .eq('user_id', req.user.id)
            .eq('status', 'unread');

        if (error) throw error;
        return res.json({ status: 'ok' });
    } catch (err) {
        console.error('[notifications read-all]', err.message);
        return res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
});

module.exports = router;
