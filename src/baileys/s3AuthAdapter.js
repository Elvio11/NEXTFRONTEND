/**
 * s3AuthAdapter.js
 * Custom Baileys Authentication State that syncs with S4 (MinIO).
 * 
 * Logic:
 * 1. On startup: Fetch all session files from S3 and populate an in-memory store.
 * 2. On update: Write changed keys/creds back to S3.
 */
'use strict';

const { proto, BufferJSON, initAuthCreds } = require('@whiskeysockets/baileys');
const { downloadFile, uploadFile, deleteFile, getFileExists } = require('../lib/storageClient');
const logger = require('../lib/logger');

const SESSION_PREFIX = 'wa-session/';

/**
 * Custom auth state that mirrors useMultiFileAuthState logic but for S3.
 */
async function useS3AuthState() {
    let creds = initAuthCreds();

    // ── Load initial credentials ─────────────────────────────────────────────
    try {
        if (await getFileExists(`${SESSION_PREFIX}creds.json`)) {
            const data = await downloadFile(`${SESSION_PREFIX}creds.json`, true);
            creds = JSON.parse(data, BufferJSON.reviver);
        }
    } catch (err) {
        logger.error('s3AuthAdapter', `Initial creds load failed: ${err.message}`);
    }

    const saveCreds = async () => {
        try {
            await uploadFile(
                `${SESSION_PREFIX}creds.json`,
                JSON.stringify(creds, BufferJSON.replacer),
                'application/json'
            );
        } catch (err) {
            logger.error('s3AuthAdapter', `Failed to save creds: ${err.message}`);
        }
    };

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(
                        ids.map(async (id) => {
                            const key = `${SESSION_PREFIX}keys/${type}-${id}.json`;
                            try {
                                if (await getFileExists(key)) {
                                    const value = await downloadFile(key, true);
                                    data[id] = JSON.parse(value, BufferJSON.reviver);
                                }
                            } catch (err) {
                                // Missing key is common (first time creation)
                                logger.debug('s3AuthAdapter', `Key ${type}-${id} not found in S3 (normal)`);
                            }
                        })
                    );
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const key = `${SESSION_PREFIX}keys/${category}-${id}.json`;
                            if (value) {
                                tasks.push(
                                    uploadFile(
                                        key,
                                        JSON.stringify(value, BufferJSON.replacer),
                                        'application/json'
                                    )
                                );
                            } else {
                                tasks.push(deleteFile(key));
                            }
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds
    };
}

module.exports = { useS3AuthState };
