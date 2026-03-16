/**
 * verifyAgentSecret.js
 * Middleware: validates X-Agent-Secret header on inbound callbacks
 * from Servers 2/3. Applied only to internal agent callback routes.
 *
 * NOTE: This is for Server 2/3 → Server 1 callbacks only.
 * For Server 1 → Server 2/3 outbound, see lib/forwardToAgent.js.
 */

'use strict';

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function verifyAgentSecret(req, res, next) {
    const incoming = req.headers['x-agent-secret'];
    const expected = process.env.AGENT_SECRET;

    if (!expected) {
        // AGENT_SECRET not in Doppler — config error, fail closed
        return res.status(500).json({ error: 'Agent secret not configured' });
    }

    if (!incoming || incoming !== expected) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    next();
}

module.exports = verifyAgentSecret;
