/**
 * resume.js
 * POST /api/resume/upload — receive PDF/DOCX, forward to Server 2 Agent 3
 *
 * Flow:
 *   1. Validate file (type + size)
 *   2. Write to FluxShare /storage/parsed-resumes/tmp_{user_id}.{ext}
 *   3. Forward to Server 2 /api/agents/resume-intelligence
 *   4. Return persona_options[] + extracted_summary from Agent 3
 *
 * File I/O target: /storage/ (FluxShare — mounted on all 3 servers)
 * Never use /tmp/ for persistent data.
 */
'use strict';

const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const verifyJWT = require('../middleware/verifyJWT');
const forwardToAgent = require('../lib/forwardToAgent');

const ALLOWED_MIME = new Set(['application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const STORAGE_BASE = '/storage/parsed-resumes';

/**
 * POST /api/resume/upload
 * Multipart form: field name = 'resume'
 */
router.post('/upload', verifyJWT, async (req, res) => {
    if (!req.files?.resume) {
        return res.status(400).json({ error: 'No file uploaded. Field name must be "resume".' });
    }

    const file = req.files.resume;

    if (!ALLOWED_MIME.has(file.mimetype)) {
        return res.status(400).json({ error: 'Only PDF and DOCX files are accepted.' });
    }
    if (file.size > MAX_BYTES) {
        return res.status(413).json({ error: 'File exceeds 5 MB limit.' });
    }

    const ext = path.extname(file.name).toLowerCase();
    const tmpPath = path.join(STORAGE_BASE, `tmp_${req.user.id}${ext}`);

    try {
        // Ensure storage directory exists (FluxShare mount)
        fs.mkdirSync(STORAGE_BASE, { recursive: true });
        await file.mv(tmpPath);
    } catch (err) {
        console.error('[resume/upload] file write error:', err.message);
        return res.status(500).json({ error: 'Failed to save file' });
    }

    // Forward to Server 2 — Agent 3 parses, generates personas, compresses
    const result = await forwardToAgent(
        process.env.SERVER2_URL,
        'resume-intelligence',
        req.user.id,
        { file_path: tmpPath, file_ext: ext.replace('.', '') }
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
