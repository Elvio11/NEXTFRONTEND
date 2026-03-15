/**
 * tgFormatter.js — Telegram-specific message formatting
 *
 * Formats outbound push notification templates for Telegram.
 * TG uses Markdown parse_mode: *bold*, _italic_
 *
 * Same 10 message types as waFormatter — interface is identical.
 * Currently uses the same formatting since both WA and TG support
 * the same *bold* and _italic_ syntax.
 */
'use strict';

const { formatMessage: waFormat } = require('./waFormatter');

/**
 * Format an outbound notification message for Telegram.
 * @param {string} messageType
 * @param {object} payload
 * @returns {string} formatted message text
 */
function formatMessage(messageType, payload) {
    // TG and WA both use *bold* and _italic_ — same output for now.
    // If TG-specific formatting is needed later (inline buttons, HTML),
    // override individual templates here.
    return waFormat(messageType, payload);
}

module.exports = { formatMessage };
