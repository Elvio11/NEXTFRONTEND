/**
 * forwardToAgent.js
 * Forwards work from Server 1 to Servers 2 or 3 via HTTP POST.
 * Always attaches X-Agent-Secret header from Doppler.
 *
 * Contract (mirrors Servers 2/3 FastAPI contract):
 *   Request:  POST <serverUrl>/api/agents/<agentName>
 *             { agent: str, user_id: uuid|null, payload: {} }
 *   Response: { status: "success|skipped|failed", duration_ms, records_processed, error }
 *
 * On network error: logs and returns a failed-status object so callers
 * always receive the same shape — never throws up to the route handler.
 */

'use strict';

const axios = require('axios');

/**
 * @param {string} serverUrl   - Base URL of target server (e.g. process.env.SERVER2_URL)
 * @param {string} agentName   - Agent identifier (e.g. 'resume_intelligence')
 * @param {string|null} userId - Supabase user UUID, or null for system-level calls
 * @param {object} payload     - Arbitrary payload forwarded to the agent
 * @returns {Promise<{ status: string, duration_ms: number, records_processed: number|null, error: string|null }>}
 */
async function forwardToAgent(serverUrl, agentName, userId, payload = {}) {
    const url = `${serverUrl}/api/agents/${agentName}`;

    try {
        const { data } = await axios.post(
            url,
            { agent: agentName, user_id: userId, payload },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Agent-Secret': process.env.AGENT_SECRET,
                },
                timeout: 120_000, // 2 minutes — agent calls can be slow (LLM inference)
            }
        );
        return data;
    } catch (err) {
        const message = err.response?.data?.error ?? err.message ?? 'Unknown agent error';
        // Log but don't throw — route handlers decide how to surface to client
        console.error(`[forwardToAgent] ${agentName} at ${url} failed:`, message);
        return {
            status: 'failed',
            duration_ms: 0,
            records_processed: null,
            error: message,
        };
    }
}

module.exports = forwardToAgent;
