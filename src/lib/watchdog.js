/**
 * watchdog.js
 * TalvixGuard Layer 1 Reliability Watchdog
 * Monitors Server 5 (AI Corp/OpenFang) and alerts via Telegram if down.
 */

'use strict';

const axios = require('axios');
const logger = require('./logger');

class TalvixGuard {
    constructor() {
        // AI Corp Server IP or hostname (Configurable via Doppler/Env)
        this.server5Url = process.env.SERVER5_URL || 'http://localhost:8005';
        this.telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
        this.founderChatId = process.env.FOUNDER_CHAT_ID;
        
        // Ping every 5 minutes
        this.intervalMs = 5 * 60 * 1000;
        this.intervalId = null;
        this.isDown = false;
    }

    start() {
        if (!this.server5Url) {
            logger.warn('watchdog', 'SERVER5_URL not set. Watchdog disabled.');
            return;
        }

        logger.info('watchdog', `Starting TalvixGuard to monitor ${this.server5Url} every ${this.intervalMs}ms`);
        this.intervalId = setInterval(() => this.ping(), this.intervalMs);
        
        // Initial ping
        this.ping();
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    async ping() {
        try {
            // OpenFang heartbeat endpoint
            const response = await axios.get(`${this.server5Url}/health/heartbeat`, { timeout: 5000 });
            
            if (response.status === 200) {
                if (this.isDown) {
                    logger.info('watchdog', 'Server 5 is BACK ONLINE.');
                    this.alertFounder('🟢 TalvixGuard: Server 5 (OpenFang) is back online.');
                    this.isDown = false;
                }
            } else {
                this.handleFailure(`Unexpected status code: ${response.status}`);
            }
        } catch (error) {
            this.handleFailure(error.message);
        }
    }

    handleFailure(reason) {
        if (!this.isDown) {
            logger.error('watchdog', `Server 5 is DOWN. Reason: ${reason}`);
            this.alertFounder(`🔴 TalvixGuard ALERT: Server 5 (OpenFang) is DOWN or unresponsive. Reason: ${reason}`);
            this.isDown = true;
        } else {
            // Already down, do nothing to avoid spam
            logger.debug('watchdog', `Server 5 still down: ${reason}`);
        }
    }

    async alertFounder(message) {
        if (!this.telegramBotToken || !this.founderChatId) {
            logger.error('watchdog', 'Cannot send Telegram alert: TELEGRAM_BOT_TOKEN or FOUNDER_CHAT_ID missing.');
            return;
        }

        try {
            await axios.post(`https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`, {
                chat_id: this.founderChatId,
                text: message,
            });
            logger.info('watchdog', 'Sent alert to founder Telegram.');
        } catch (err) {
            logger.error('watchdog', `Failed to send Telegram alert: ${err.message}`);
        }
    }
}

// Export a singleton instance
module.exports = new TalvixGuard();
