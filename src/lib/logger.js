/**
 * logger.js — Structured Logging for Server 1
 * Standardizes log format across the Gateway.
 *
 * Pattern: [timestamp] [level] [context] message
 */
'use strict';

const fs = require('fs');
const path = require('path');

const levels = {
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    DEBUG: 'DEBUG',
};

const formatMessage = (level, context, message) => {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${context}] ${message}`;
};

const logger = {
    info: (context, message) => {
        console.log(formatMessage(levels.INFO, context, message));
    },
    warn: (context, message) => {
        console.warn(formatMessage(levels.WARN, context, message));
    },
    error: (context, message) => {
        console.error(formatMessage(levels.ERROR, context, message));
    },
    debug: (context, message) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(formatMessage(levels.DEBUG, context, message));
        }
    },
};

module.exports = logger;
