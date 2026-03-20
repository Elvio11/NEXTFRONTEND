/**
 * WhatsApp Message Formatter
 * Formats bot responses for WhatsApp (bold, italic, etc.).
 */
'use strict';

module.exports = {
    format: (text) => text.split('\n').map(line => line.trim()).join('\n') // Initial basic formatter
};
