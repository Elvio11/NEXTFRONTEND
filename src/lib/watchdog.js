/**
 * watchdog.js
 * Client-side integration for TalvixGuard.
 * Sends local heartbeats to the standalone watchdog process.
 */

'use strict';

const axios = require('axios');
const logger = require('./logger');

class TalvixGuardClient {
    constructor() {
        this.watchdogUrl = `http://localhost:${process.env.WATCHDOG_PORT || 8081}`;
        this.intervalMs = 2 * 60 * 1000; // 2 minutes
        this.intervalId = null;
    }

    start() {
        logger.info('watchdog-client', 'Starting heartbeat client for TalvixGuard...');
        this.intervalId = setInterval(() => this.sendHeartbeat(), this.intervalMs);
        this.sendHeartbeat();
    }

    async sendHeartbeat() {
        try {
            await axios.post(`${this.watchdogUrl}/heartbeat`, {}, { timeout: 5000 });
        } catch (err) {
            // Standalone watchdog might not be running yet, or port blocked
            logger.debug('watchdog-client', `Watchdog heartbeat failed: ${err.message}`);
        }
    }

    stop() {
        if (this.intervalId) clearInterval(this.intervalId);
    }
}

module.exports = new TalvixGuardClient();
