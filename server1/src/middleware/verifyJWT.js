/**
 * verifyJWT.js
 * Middleware: validates Bearer JWT on every /api/* route.
 * Attaches req.user = { id, email, tier } from the token payload.
 * All secrets from Doppler via process.env — no .env files.
 */

'use strict';

const jwt = require('jsonwebtoken');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function verifyJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Attach only the fields routes need — never forward the raw token payload
    req.user = {
      id:    payload.sub,   // Supabase user UUID stored in 'sub'
      email: payload.email,
      tier:  payload.tier ?? 'free',
    };
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({ error: message });
  }
}

module.exports = verifyJWT;
