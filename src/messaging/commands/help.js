/**
 * help.js — HELP command handler
 * Available to: ALL users (free + paid)
 */
'use strict';

const FREE_HELP = `📋 *Talvix Commands*

STATUS — Your job application summary
JOBS — See your top 3 job matches today
HELP — This message
STOP — Unsubscribe from notifications

🔒 Paid commands: APPLY_NOW, PAUSE, RESUME, REPORT, COACH
Upgrade at talvix.in`;

const PAID_HELP = `📋 *Talvix Commands*

STATUS — Your application dashboard summary
JOBS — Your top 25 job matches today
APPLY_NOW — Trigger apply cycle immediately
PAUSE — Pause auto-applying
RESUME — Resume auto-applying
REPORT — Full weekly performance report
COACH — Get your AI coaching message now
STOP — Unsubscribe from notifications
HELP — This message`;

module.exports = {
    async execute({ user, sendFn }) {
        const message = (user.tier === 'student' || user.tier === 'professional') ? PAID_HELP : FREE_HELP;
        await sendFn(message);
    },
};
