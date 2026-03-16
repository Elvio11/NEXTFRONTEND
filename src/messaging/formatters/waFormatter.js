/**
 * waFormatter.js — WhatsApp-specific message formatting
 *
 * Formats outbound push notification templates for WhatsApp.
 * WA uses *bold* and _italic_ markdown-like syntax.
 *
 * Also exports shared IST formatting utilities used by command handlers.
 */
'use strict';

/**
 * Format a Date to IST time string: "3:45 PM IST"
 * @param {Date} date
 * @returns {string}
 */
function formatIST(date) {
    return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    }) + ' IST';
}

/**
 * Format a Date to IST date string: "15 Mar 2026"
 * @param {Date} date
 * @returns {string}
 */
function formatDateIST(date) {
    return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

/**
 * Format a Date to full IST datetime: "15 Mar 2026, 3:45 PM IST"
 * @param {Date} date
 * @returns {string}
 */
function formatDateTimeIST(date) {
    return `${formatDateIST(date)}, ${formatIST(date)}`;
}

/**
 * Format an outbound notification message for WhatsApp.
 * @param {string} messageType
 * @param {object} payload
 * @returns {string} formatted message text
 */
function formatMessage(messageType, payload) {
    switch (messageType) {
        case 'job_alert':
            return formatJobAlert(payload);
        case 'application_update':
            return formatApplicationUpdate(payload);
        case 'session_expiring_7d':
            return formatSessionExpiring(payload, 7);
        case 'session_expiring_3d':
            return formatSessionExpiring(payload, 3);
        case 'session_expired':
            return formatSessionExpired(payload);
        case 'apply_paused':
            return formatApplyPaused(payload);
        case 'apply_submitted':
            return formatApplySubmitted(payload);
        case 'interview_scheduled':
            return formatInterviewScheduled(payload);
        case 'coach':
            return formatCoach(payload);
        case 'subscription_expiring':
            return formatSubscriptionExpiring(payload);
        default:
            return payload.message || 'You have a new notification from Talvix.';
    }
}

function formatJobAlert(p) {
    const tierNote = p.apply_tier === 1
        ? 'Auto-queued for apply tonight ✅'
        : `Apply at: talvix.in/jobs/${p.job_id}`;
    return `🎯 *New Match: ${p.fit_score}% fit*
${p.job_title} at ${p.company}
📍 ${p.city || 'Remote'} · ${p.employment_type || 'Full-time'}
${tierNote}`;
}

function formatApplicationUpdate(p) {
    switch (p.status) {
        case 'callback':
            return `📬 *Callback received!*
${p.company} responded to your application for ${p.job_title}.
Check talvix.in/applications for details.`;
        case 'interview':
            return `🎉 *Interview scheduled!*
${p.company} — ${p.job_title}
Prepare at talvix.in/applications → Interview Prep`;
        case 'offer':
            return `🏆 *Job offer received!*
${p.company} has extended an offer for ${p.job_title}.
See details at talvix.in/applications`;
        case 'rejected':
            return `📭 ${p.company} passed on your application for ${p.job_title}.
Talvix will keep applying to similar roles.`;
        default:
            return `📋 Application update: ${p.job_title} at ${p.company} — ${p.status}`;
    }
}

function formatSessionExpiring(p, days) {
    if (days === 7) {
        return `⚠️ *Session expiring in 7 days*
Your ${p.platform} session expires on ${p.expires_at}.
Reconnect at talvix.in/settings to keep auto-applying.`;
    }
    return `🚨 *Session expiring in 3 days*
Your ${p.platform} session expires on ${p.expires_at}.
Auto-apply will pause if not renewed.
Reconnect now: talvix.in/settings`;
}

function formatSessionExpired(p) {
    return `❌ *Session expired — auto-apply paused*
Your ${p.platform} session has expired.
Reconnect at talvix.in/settings to resume.`;
}

function formatApplyPaused(p) {
    return `⛔ *Auto-apply paused*
3 consecutive application failures detected (${p.failure_reason}).
Check talvix.in/settings to diagnose and resume.`;
}

function formatApplySubmitted(p) {
    return `✅ *Applied!*
${p.job_title} at ${p.company} (${p.platform})
Application #${p.monthly_apply_count} of 250 this month.`;
}

function formatInterviewScheduled(p) {
    return `📅 *Interview prep ready*
Your interview with ${p.company} is on ${p.date}.
Prep materials added to talvix.in/applications.`;
}

function formatCoach(p) {
    return p.message || '💬 Your coaching message is ready at talvix.in/dashboard.';
}

function formatSubscriptionExpiring(p) {
    return `💳 *Subscription expiring in 3 days*
Renew at talvix.in/settings to keep auto-apply running.
Plan: ₹499/month`;
}

module.exports = {
    formatMessage,
    formatIST,
    formatDateIST,
    formatDateTimeIST,
};
