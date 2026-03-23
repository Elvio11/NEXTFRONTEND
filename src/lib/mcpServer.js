/**
 * mcpServer.js
 * MCP Server for Talvix Server 1
 * Wraps 14 read-only analytics endpoints as MCP tools for AI Corp.
 */
const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { SSEServerTransport } = require("@modelcontextprotocol/sdk/server/sse.js");
const express = require("express");
const logger = require('./logger');
const analyticsService = require('./analyticsService');

class TalvixMCPServer {
    constructor() {
        this.server = new Server(
            { name: "talvix-server1-mcp", version: "1.0.0" },
            { capabilities: { tools: {} } }
        );
        this.setupTools();
    }

    setupTools() {
        const tools = [
            { name: "get_metrics", desc: "Core product metrics (MRR, users, growth).", method: 'getMetrics' },
            { name: "get_agent_performance", desc: "Health of the 15 product agents.", method: 'getAgentPerformance' },
            { name: "get_scraper_health", desc: "Job scraping status across all sources.", method: 'getScraperHealth' },
            { name: "get_conversion_data", desc: "Free-to-paid conversion funnel.", method: 'getConversionData' },
            { name: "get_retention_data", desc: "Churn signals and at-risk users.", intel: 'retention-data' },
            { name: "get_bd_intelligence", desc: "Partnership and outreach pipeline.", intel: 'bd-intelligence' },
            { name: "get_product_intelligence", desc: "Feature requests, support themes.", intel: 'product-intelligence' },
            { name: "get_engineering_metrics", desc: "Code velocity and deployment health.", intel: 'engineering-metrics' },
            { name: "get_db_health", desc: "Supabase database health.", method: 'getDBHealth' },
            { name: "get_infra_metrics", desc: "All 5 servers health.", intel: 'infra-metrics' },
            { name: "get_behavior_analytics", desc: "User behavior patterns.", intel: 'behavior-analytics' },
            { name: "get_user_status", desc: "Account health lookup for a specific user.", intel: 'user-status' },
            { name: "get_support_themes", desc: "Support ticket themes and sentiment.", intel: 'support-themes' },
            { name: "get_geo_distribution", desc: "Geographic user distribution.", intel: 'geo-distribution' }
        ];

        tools.forEach(tool => {
            this.server.addTool({
                name: tool.name,
                description: tool.desc,
                inputSchema: { 
                    type: "object", 
                    properties: tool.name === 'get_user_status' ? { user_id: { type: "string" } } : {} 
                },
                handler: async (args) => {
                    try {
                        let data;
                        if (tool.method) {
                            data = await analyticsService[tool.method]();
                        } else {
                            data = await analyticsService.getIntel(tool.intel + (args.user_id ? `-${args.user_id}` : ''));
                        }
                        return { content: [{ type: "text", text: JSON.stringify(data) }] };
                    } catch (err) {
                        logger.error('mcp', `Tool ${tool.name} error: ${err.message}`);
                        return { content: [{ type: "text", text: JSON.stringify({ error: err.message }) }] };
                    }
                }
            });
        });
    }

    createRouter() {
        const router = express.Router();
        let sseTransport = null;

        router.get("/", async (req, res) => {
            sseTransport = new SSEServerTransport("/api/mcp/message", res);
            await this.server.connect(sseTransport);
            logger.info('mcp', 'MCP Server connected via SSE');
            req.on('close', () => { sseTransport = null; });
        });

        router.post("/message", async (req, res) => {
            if (!sseTransport) return res.status(400).json({ error: "No active SSE connection" });
            try {
                await sseTransport.handlePostMessage(req, res);
            } catch (err) {
                logger.error('mcp', `Error: ${err.message}`);
                if (!res.headersSent) res.status(500).json({ error: err.message });
            }
        });

        return router;
    }
}

module.exports = TalvixMCPServer;
