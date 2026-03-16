/**
 * resume.js
 * POST /api/resume/upload — receive PDF/DOCX, forward to Server 2 Agent 3
 *
 * 6-Layer Upload Security (March 16 Locked Decisions):
 *   Layer 1 (here): 5MB cap, ext whitelist (.pdf/.docx), UUID rename, 3/hr rate limit, JWT required
 *   Layer 2 (here): Magic bytes validation (%PDF for PDF, PK ZIP for DOCX)
 *   Layers 3-6: Server 2 (DOCX bomb check, macro strip, sandboxed parse, storage isolation)
 *
 * Flow:
 *   1. Validate file (type + size + magic bytes)
 *   2. Upload to MinIO: uploads/{user_id}/{uuid}.{ext}
 *   3. Forward to Server 2 /api/agents/resume-intelligence
 *   4. Return persona_options[] + extracted_summary from Agent 3
 */
'use strict';

const router = require('express').Router();
const crypto = require('crypto');
const verifyJWT = require('../middleware/verifyJWT');
const forwardToAgent = require('../lib/forwardToAgent');
const { uploadFile } = require('../lib/storageClient');
const logger = require('../lib/logger');
const { getSupabase } = require('../lib/supabase');

// ── Layer 1: Extension whitelist + size cap ─────────────────────────────────
const ALLOWED_EXT = new Set(['.pdf', '.docx']);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// ── Layer 2: Magic bytes signatures ─────────────────────────────────────────
const MAGIC_BYTES = {
    '.pdf':  Buffer.from([0x25, 0x50, 0x44, 0x46]), // %PDF
    '.docx': Buffer.from([0x50, 0x4B, 0x03, 0x04]), // PK ZIP header
};

// ── Rate limit: in-memory (3 uploads/user/hour) ────────────────────────────
const uploadCounts = new Map(); // userId -> { count, resetAt }
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(userId) {
    const now = Date.now();
    const entry = uploadCounts.get(userId);
    if (!entry || now > entry.resetAt) {
        uploadCounts.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
        return true;
    }
    if (entry.count >= RATE_LIMIT) return false;
    entry.count++;
    return true;
}

/**
 * POST /api/resume/upload
 * Multipart form: field name = 'resume'
 */
router.post('/upload', verifyJWT, async (req, res) => {
    if (!req.files?.resume) {
        return res.status(400).json({ error: 'No file uploaded. Field name must be "resume".' });
    }

    const file = req.files.resume;
    const userId = req.user.id;

    // ── Layer 1a: Size check ────────────────────────────────────────────
    if (file.size > MAX_BYTES) {
        return res.status(413).json({ error: 'File exceeds 5 MB limit.' });
    }

    // ── Layer 1b: Extension whitelist (case-insensitive) ────────────────
    const originalName = file.name || '';
    const dotIdx = originalName.lastIndexOf('.');
    const ext = dotIdx >= 0 ? originalName.slice(dotIdx).toLowerCase() : '';
    if (!ALLOWED_EXT.has(ext)) {
        return res.status(400).json({ error: 'Only .pdf and .docx files are accepted.' });
    }

    // ── Layer 1c: Rate limit ────────────────────────────────────────────
    if (!checkRateLimit(userId)) {
        logger.warn('resume', `rate limit hit: user ${userId}`);
        return res.status(429).json({ error: 'Upload limit reached. Max 3 uploads per hour.' });
    }

    // ── Layer 1d: UUID rename (original filename stored in metadata only) ──
    const fileUuid = crypto.randomUUID();
    const safeKey = `uploads/${userId}/${fileUuid}${ext}`;

    // ── Layer 2: Magic bytes validation ─────────────────────────────────
    const expectedMagic = MAGIC_BYTES[ext];
    if (expectedMagic) {
        const fileHeader = file.data.subarray(0, expectedMagic.length);
        if (!fileHeader.equals(expectedMagic)) {
            logger.warn('resume', `magic bytes mismatch: user ${userId}, ext=${ext}`);

            // Track repeated magic byte failures for abuse detection
            try {
                const sb = getSupabase();
                await sb.from('agent_logs').insert({
                    agent_name: 'upload_security',
                    user_id: userId,
                    status: 'failed',
                    error_message: `Layer 2 reject: magic bytes mismatch for ${ext}`,
                    metadata: { original_filename: originalName },
                });
            } catch (_) { /* best-effort logging */ }

            return res.status(400).json({
                error: 'File content does not match its extension. Upload rejected.',
            });
        }
    }

    // ── Upload to MinIO ─────────────────────────────────────────────────
    try {
        await uploadFile(safeKey, file.data, file.mimetype);
    } catch (err) {
        logger.error('resume', `MinIO upload error: ${err.message}`);
        return res.status(500).json({ error: 'Failed to store resume.' });
    }

    // Discard file bytes from Server 1 memory immediately
    file.data = null;

    // ── Forward to Server 2 — Agent 3 ───────────────────────────────────
    const result = await forwardToAgent(
        process.env.SERVER2_URL,
        'resume-intelligence',
        userId,
        { s3_key: safeKey, original_ext: ext.replace('.', '') }
    );

    if (result.status === 'failed') {
        return res.status(502).json({ error: result.error ?? 'Resume parsing failed' });
    }

    return res.json({
        status: 'success',
        persona_options: result.persona_options ?? [],
        extracted_summary: result.extracted_summary ?? {},
    });
});

module.exports = router;
