/**
 * Telegram Command Formatter
 * Sanitizes and formats bot responses for MarkdownV2.
 */
'use strict';

module.exports = {
    format: (text) => text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&') // Basic TG escape
};
