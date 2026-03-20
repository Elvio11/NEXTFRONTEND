/**
 * mcpServer.js
 * MCP Server for Talvix Server 1
 * Wraps 14 read-only internal REST/Database endpoints as MCP tools for AI Corp (OpenFang).
 * Utilizes SSE over HTTP to connect.
 * 
 * Strict Security enforced externally by verifyJWT and stripSensitive middleware.
 */

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { SSEServerTransport } = require("@modelcontextprotocol/sdk/server/sse.js");
const express = require("express");
const logger = require('./logger');
const { getSupabase } = require('./supabaseClient');

// DRIVEN CONFIGURATION: All 14 endpoints mapped declaratively.
// 20x efficiency: 0 repeated try-catch blocks.
const MCP_TOOLS = [
    { name: "get_product_metrics", desc: "Retrieve aggregated product metrics (MRR, total active users, new signups).", rpc: "mcp_get_product_metrics" },
    { name: "get_scraper_health", desc: "Check health and success rates of Agent 9/12 scraping systems via DB system logs.", rpc: "mcp_get_scraper_health" },
    { name: "get_user_pipeline", desc: "Retrieve user progression funnel analytics.", rpc: "mcp_get_user_pipeline" },
    { name: "get_system_health", desc: "Retrieve overall system health for Servers 1, 2, 3, and DB.", rpc: "mcp_get_system_health" },
    { name: "get_notifications_sent", desc: "Retrieve stats on WhatsApp/Email outreach to users.", rpc: "mcp_get_notifications_sent" },
    { name: "get_active_subscriptions", desc: "Retrieve active paid subscription volume.", rpc: "mcp_get_active_subscriptions" },
    { name: "get_churn_feedback", desc: "Retrieve recent cancellation reasons for feedback analysis.", rpc: "mcp_get_churn_feedback" },
    { name: "get_db_metrics", desc: "Retrieve database sizing and table counts.", rpc: "mcp_get_db_metrics" },
    { name: "get_match_quality", desc: "Retrieve aggregate fit score statistics across all users.", rpc: "mcp_get_match_quality" },
    { name: "get_error_summary", desc: "Retrieve counts of recent fatal/critical backend errors.", rpc: "mcp_get_error_summary" },
    { name: "get_storage_usage", desc: "Retrieve MinIO usage stats for Server 4 via DB logs.", rpc: "mcp_get_storage_usage" },
    { name: "get_whatsapp_health", desc: "Check Baileys socket connection health stats from DB.", rpc: "mcp_get_whatsapp_health" },
    { name: "get_llm_usage", desc: "Check Sarvam-M and Gemini Flash token volumes from DB.", rpc: "mcp_get_llm_usage" },
    { name: "get_pending_approvals", desc: "Check if there are messages/actions queued for human-in-the-loop review.", rpc: "mcp_get_pending_approvals" }
];

class TalvixMCPServer {
    constructor() {
        this.server = new Server(
            { name: "talvix-server1-mcp", version: "1.0.0" },
            { capabilities: { tools: {} } }
        );
        this.setupTools();
    }

    // DRY tool registration
    setupTools() {
        MCP_TOOLS.forEach(({ name, desc, rpc }) => {
            this.server.addTool({
                name,
                description: desc,
                inputSchema: { type: "object", properties: {} },
                handler: async () => this.handleRpcCall(name, rpc)
            });
        });
    }

    // Universal robust handler
    async handleRpcCall(toolName, rpcName) {
        try {
            const sb = getSupabase();
            const { data, error } = await sb.rpc(rpcName);
            if (error) throw error;
            return { content: [{ type: "text", text: JSON.stringify(data || { status: "no_data_rpc_missing" }) }] };
        } catch (err) {
            logger.error('mcp', `Tool ${toolName} error: ${err.message}`);
            return { content: [{ type: "text", text: JSON.stringify({ error: err.message }) }] };
        }
    }

    createRouter() {
        const router = express.Router();
        let sseTransport = null;

        router.get("/", async (req, res) => {
            logger.info('mcp', `SSE Connection requested from ${req.ip} (User: ${req.user?.id || 'unknown'})`);
            sseTransport = new SSEServerTransport("/api/mcp/message", res);
            await this.server.connect(sseTransport);
            logger.info('mcp', 'MCP Server connected via SSE successfully');
            
            req.on('close', () => {
                logger.info('mcp', 'SSE Connection closed by client');
                sseTransport = null;
            });
        });

        router.post("/message", async (req, res) => {
            if (!sseTransport) {
                logger.warn('mcp', 'Received message but no active SSE transport available');
                return res.status(400).json({ error: "No active SSE connection" });
            }
            try {
                await sseTransport.handlePostMessage(req, res);
            } catch (err) {
                logger.error('mcp', `Error handling message: ${err.message}`);
                if (!res.headersSent) res.status(500).json({ error: err.message });
            }
        });

        return router;
    }
}

module.exports = TalvixMCPServer;