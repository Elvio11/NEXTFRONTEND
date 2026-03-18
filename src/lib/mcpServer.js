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

class TalvixMCPServer {
    constructor() {
        this.server = new Server(
            { name: "talvix-server1-mcp", version: "1.0.0" },
            { capabilities: { tools: {} } }
        );

        this.setupTools();
    }

    setupTools() {
        // We register 14 read-only tools exposed to OpenFang.

        // 1. Get Product Metrics
        this.server.addTool({
            name: "get_product_metrics",
            description: "Retrieve aggregated product metrics (MRR, total active users, new signups).",
            inputSchema: { type: "object", properties: {} },
            handler: async () => {
                try {
                    const sb = getSupabase();
                    const { data, error } = await sb.rpc('mcp_get_product_metrics');
                    if (error) throw error;
                    return { content: [{ type: "text", text: JSON.stringify(data || { status: "no_data_rpc_missing" }) }] };
                } catch (err) {
                    logger.error('mcp', `Tool get_product_metrics error: ${err.message}`);
                    return { content: [{ type: "text", text: JSON.stringify({ error: err.message }) }] };
                }
            }
        });

        // 2. Get Scraper Health
        this.server.addTool({
            name: "get_scraper_health",
            description: "Check health and success rates of Agent 9/12 scraping systems via DB system logs.",
            inputSchema: { type: "object", properties: {} },
            handler: async () => {
                try {
                    const sb = getSupabase();
                    const { data, error } = await sb.rpc('mcp_get_scraper_health');
                    if (error) throw error;
                    return { content: [{ type: "text", text: JSON.stringify(data || { status: "no_data_rpc_missing" }) }] };
                } catch (err) {
                    logger.error('mcp', `Tool get_scraper_health error: ${err.message}`);
                    return { content: [{ type: "text", text: JSON.stringify({ error: err.message }) }] };
                }
            }
        });

        // 3. Get User Pipeline
        this.server.addTool({
            name: "get_user_pipeline",
            description: "Retrieve user progression funnel analytics.",
            inputSchema: { type: "object", properties: {} },
            handler: async () => {
                try {
                    const sb = getSupabase();
                    const { data, error } = await sb.rpc('mcp_get_user_pipeline');
                    if (error) throw error;
                    return { content: [{ type: "text", text: JSON.stringify(data || { status: "no_data_rpc_missing" }) }] };
                } catch (err) {
                    logger.error('mcp', `Tool get_user_pipeline error: ${err.message}`);
                    return { content: [{ type: "text", text: JSON.stringify({ error: err.message }) }] };
                }
            }
        });

        // 4. Get System Health
        this.server.addTool({
            name: "get_system_health",
            description: "Retrieve overall system health for Servers 1, 2, 3, and DB.",
            inputSchema: { type: "object", properties: {} },
            handler: async () => {
                try {
                    const sb = getSupabase();
                    const { data, error } = await sb.rpc('mcp_get_system_health');
                    if (error) throw error;
                    return { content: [{ type: "text", text: JSON.stringify(data || { status: "no_data_rpc_missing" }) }] };
                } catch (err) {
                    logger.error('mcp', `Tool get_system_health error: ${err.message}`);
                    return { content: [{ type: "text", text: JSON.stringify({ error: err.message }) }] };
                }
            }
        });

        // 5. Get Notifications Sent
        this.server.addTool({
            name: "get_notifications_sent",
            description: "Retrieve stats on WhatsApp/Email outreach to users.",
            inputSchema: { type: "object", properties: {} },
            handler: async () => {
                try {
                    const sb = getSupabase();
                    const { data, error } = await sb.rpc('mcp_get_notifications_sent');
                    if (error) throw error;
                    return { content: [{ type: "text", text: JSON.stringify(data || { status: "no_data_rpc_missing" }) }] };
                } catch (err) {
                    logger.error('mcp', `Tool get_notifications_sent error: ${err.message}`);
                    return { content: [{ type: "text", text: JSON.stringify({ error: err.message }) }] };
                }
            }
        });

        // 6. Get Active Subscriptions
        this.server.addTool({
            name: "get_active_subscriptions",
            description: "Retrieve active paid subscription volume.",
            inputSchema: { type: "object", properties: {} },
            handler: async () => {
                try {
                    const sb = getSupabase();
                    const { data, error } = await sb.rpc('mcp_get_active_subscriptions');
                    if (error) throw error;
                    return { content: [{ type: "text", text: JSON.stringify(data || { status: "no_data_rpc_missing" }) }] };
                } catch (err) {
                    logger.error('mcp', `Tool get_active_subscriptions error: ${err.message}`);
                    return { content: [{ type: "text", text: JSON.stringify({ error: err.message }) }] };
                }
            }
        });

        // 7. Get Recent Churn Feedbacks
        this.server.addTool({
            name: "get_churn_feedback",
            description: "Retrieve recent cancellation reasons for feedback analysis.",
            inputSchema: { type: "object", properties: {} },
            handler: async () => {
                try {
                    const sb = getSupabase();
                    const { data, error } = await sb.rpc('mcp_get_churn_feedback');
                    if (error) throw error;
                    return { content: [{ type: "text", text: JSON.stringify(data || { status: "no_data_rpc_missing" }) }] };
                } catch (err) {
                    logger.error('mcp', `Tool get_churn_feedback error: ${err.message}`);
                    return { content: [{ type: "text", text: JSON.stringify({ error: err.message }) }] };
                }
            }
        });

        // 8. Get Database Metrics
        this.server.addTool({
            name: "get_db_metrics",
            description: "Retrieve database sizing and table counts.",
            inputSchema: { type: "object", properties: {} },
            handler: async () => {
                try {
                    const sb = getSupabase();
                    const { data, error } = await sb.rpc('mcp_get_db_metrics');
                    if (error) throw error;
                    return { content: [{ type: "text", text: JSON.stringify(data || { status: "no_data_rpc_missing" }) }] };
                } catch (err) {
                    logger.error('mcp', `Tool get_db_metrics error: ${err.message}`);
                    return { content: [{ type: "text", text: JSON.stringify({ error: err.message }) }] };
                }
            }
        });

        // 9. Get Job Match Quality
        this.server.addTool({
            name: "get_match_quality",
            description: "Retrieve aggregate fit score statistics across all users.",
            inputSchema: { type: "object", properties: {} },
            handler: async () => {
                try {
                    const sb = getSupabase();
                    const { data, error } = await sb.rpc('mcp_get_match_quality');
                    if (error) throw error;
                    return { content: [{ type: "text", text: JSON.stringify(data || { status: "no_data_rpc_missing" }) }] };
                } catch (err) {
                    logger.error('mcp', `Tool get_match_quality error: ${err.message}`);
                    return { content: [{ type: "text", text: JSON.stringify({ error: err.message }) }] };
                }
            }
        });

        // 10. Get Error Logs Summary
        this.server.addTool({
            name: "get_error_summary",
            description: "Retrieve counts of recent fatal/critical backend errors.",
            inputSchema: { type: "object", properties: {} },
            handler: async () => {
                try {
                    const sb = getSupabase();
                    const { data, error } = await sb.rpc('mcp_get_error_summary');
                    if (error) throw error;
                    return { content: [{ type: "text", text: JSON.stringify(data || { status: "no_data_rpc_missing" }) }] };
                } catch (err) {
                    logger.error('mcp', `Tool get_error_summary error: ${err.message}`);
                    return { content: [{ type: "text", text: JSON.stringify({ error: err.message }) }] };
                }
            }
        });

        // 11. Get Storage Usage Server 4
        this.server.addTool({
            name: "get_storage_usage",
            description: "Retrieve MinIO usage stats for Server 4 via DB logs.",
            inputSchema: { type: "object", properties: {} },
            handler: async () => {
                try {
                    const sb = getSupabase();
                    const { data, error } = await sb.rpc('mcp_get_storage_usage');
                    if (error) throw error;
                    return { content: [{ type: "text", text: JSON.stringify(data || { status: "no_data_rpc_missing" }) }] };
                } catch (err) {
                    logger.error('mcp', `Tool get_storage_usage error: ${err.message}`);
                    return { content: [{ type: "text", text: JSON.stringify({ error: err.message }) }] };
                }
            }
        });

        // 12. Get WhatsApp Health
        this.server.addTool({
            name: "get_whatsapp_health",
            description: "Check Baileys socket connection health stats from DB.",
            inputSchema: { type: "object", properties: {} },
            handler: async () => {
                try {
                    const sb = getSupabase();
                    const { data, error } = await sb.rpc('mcp_get_whatsapp_health');
                    if (error) throw error;
                    return { content: [{ type: "text", text: JSON.stringify(data || { status: "no_data_rpc_missing" }) }] };
                } catch (err) {
                    logger.error('mcp', `Tool get_whatsapp_health error: ${err.message}`);
                    return { content: [{ type: "text", text: JSON.stringify({ error: err.message }) }] };
                }
            }
        });

        // 13. Get LLM Token Usage
        this.server.addTool({
            name: "get_llm_usage",
            description: "Check Sarvam-M and Gemini Flash token volumes from DB.",
            inputSchema: { type: "object", properties: {} },
            handler: async () => {
                try {
                    const sb = getSupabase();
                    const { data, error } = await sb.rpc('mcp_get_llm_usage');
                    if (error) throw error;
                    return { content: [{ type: "text", text: JSON.stringify(data || { status: "no_data_rpc_missing" }) }] };
                } catch (err) {
                    logger.error('mcp', `Tool get_llm_usage error: ${err.message}`);
                    return { content: [{ type: "text", text: JSON.stringify({ error: err.message }) }] };
                }
            }
        });

        // 14. Get Pending Approvals
        this.server.addTool({
            name: "get_pending_approvals",
            description: "Check if there are messages/actions queued for human-in-the-loop review.",
            inputSchema: { type: "object", properties: {} },
            handler: async () => {
                try {
                    const sb = getSupabase();
                    const { data, error } = await sb.rpc('mcp_get_pending_approvals');
                    if (error) throw error;
                    return { content: [{ type: "text", text: JSON.stringify(data || { status: "no_data_rpc_missing" }) }] };
                } catch (err) {
                    logger.error('mcp', `Tool get_pending_approvals error: ${err.message}`);
                    return { content: [{ type: "text", text: JSON.stringify({ error: err.message }) }] };
                }
            }
        });
    }

    createRouter() {
        const router = express.Router();
        let sseTransport = null;

        // Establish the SSE connection
        router.get("/", async (req, res) => {
            logger.info('mcp', `SSE Connection requested from ${req.ip} (User: ${req.user?.id || 'unknown'})`);
            
            sseTransport = new SSEServerTransport("/api/mcp/message", res);
            await this.server.connect(sseTransport);
            
            logger.info('mcp', 'MCP Server connected via SSE successfully');
            
            // Handle client disconnect
            req.on('close', () => {
                logger.info('mcp', 'SSE Connection closed by client');
                sseTransport = null;
            });
        });

        // Receive JSON-RPC messages from the client
        router.post("/message", async (req, res) => {
            if (!sseTransport) {
                logger.warn('mcp', 'Received message but no active SSE transport available');
                return res.status(400).json({ error: "No active SSE connection" });
            }
            try {
                await sseTransport.handlePostMessage(req, res);
            } catch (err) {
                logger.error('mcp', `Error handling message: ${err.message}`);
                // Only send error response if headers haven't been sent by handlePostMessage
                if (!res.headersSent) {
                    res.status(500).json({ error: err.message });
                }
            }
        });

        return router;
    }
}

module.exports = TalvixMCPServer;
