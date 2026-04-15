const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');
const { hashPassword, verifyPassword } = require('../auth');
const { parse, changePasswordSchema, forgotRequestSchema, resetPasswordSchema, deleteAccountSchema } = require('../validators');
const { UPLOAD_DIR } = require('../upload');

const router = express.Router();

router.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const data = parse(changePasswordSchema, req.body);
    const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.userId);
    const ok = await verifyPassword(data.current_password, row.password_hash);
    if (!ok) { const e = new Error('current password is wrong'); e.status = 401; e.expose = true; throw e; }
    const hash = await hashPassword(data.new_password);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = strftime(\'%s\',\'now\') WHERE id = ?')
      .run(hash, req.userId);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Request a password reset token.
// Demo policy: since there's no email service, we return the token directly
// IF you're not already signed in. A real deployment would email the link.
router.post('/forgot-password', (req, res, next) => {
  try {
    const data = parse(forgotRequestSchema, req.body);
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email);
    if (!user) {
      // Don't reveal account existence - but because there's no email in the demo,
      // be explicit so users can actually test the flow.
      return res.json({ ok: true, delivery: 'none', message: 'If that email exists, a reset link was prepared.' });
    }
    const token = crypto.randomBytes(24).toString('hex');
    db.prepare('INSERT INTO password_resets (user_id, token) VALUES (?, ?)').run(user.id, token);
    // Demo return path - a real prod app would email this.
    res.json({
      ok: true,
      delivery: 'inline',
      token,
      message: 'Reset token generated. In a real deployment this would be emailed to you. For this demo, use it directly on the Reset page.',
    });
  } catch (e) { next(e); }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const data = parse(resetPasswordSchema, req.body);
    const row = db.prepare('SELECT * FROM password_resets WHERE token = ? AND used_at IS NULL').get(data.token);
    if (!row) { const e = new Error('invalid or expired token'); e.status = 400; e.expose = true; throw e; }
    // 1-hour TTL
    const now = Math.floor(Date.now() / 1000);
    if (now - Number(row.created_at) > 3600) {
      const e = new Error('token expired'); e.status = 400; e.expose = true; throw e;
    }
    const hash = await hashPassword(data.new_password);
    const tx = db.transaction(() => {
      db.prepare('UPDATE users SET password_hash = ?, updated_at = strftime(\'%s\',\'now\') WHERE id = ?').run(hash, row.user_id);
      db.prepare('UPDATE password_resets SET used_at = strftime(\'%s\',\'now\') WHERE id = ?').run(row.id);
    });
    tx();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Delete account: irreversible.
router.post('/delete', requireAuth, async (req, res, next) => {
  try {
    const data = parse(deleteAccountSchema, req.body);
    const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.userId);
    const ok = await verifyPassword(data.password, row.password_hash);
    if (!ok) { const e = new Error('password is wrong'); e.status = 401; e.expose = true; throw e; }
    // Remove uploaded photo files too
    const files = db.prepare('SELECT filename FROM photos WHERE user_id = ?').all(req.userId);
    for (const f of files) {
      const abs = path.join(UPLOAD_DIR, f.filename);
      try { if (fs.existsSync(abs)) fs.unlinkSync(abs); } catch {}
    }
    db.prepare('DELETE FROM users WHERE id = ?').run(req.userId); // cascades
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
