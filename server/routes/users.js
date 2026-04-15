const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');
const { parse, updateProfileSchema, photoOrderSchema } = require('../validators');
const { upload, UPLOAD_DIR } = require('../upload');
const { publicUser } = require('./auth');

const router = express.Router();
const MAX_PHOTOS = 6;

function photosFor(userId) {
  return db.prepare(`
    SELECT id, filename, is_primary, sort_order, created_at
    FROM photos WHERE user_id = ?
    ORDER BY is_primary DESC, sort_order ASC, id ASC
  `).all(userId);
}

function connectionStatus(viewerId, targetId) {
  if (viewerId === targetId) return 'self';
  const outgoing = db.prepare('SELECT 1 FROM connections WHERE from_user_id = ? AND to_user_id = ?').get(viewerId, targetId);
  const incoming = db.prepare('SELECT 1 FROM connections WHERE from_user_id = ? AND to_user_id = ?').get(targetId, viewerId);
  if (outgoing && incoming) return 'mutual';
  if (outgoing) return 'outgoing_pending';
  if (incoming) return 'incoming_pending';
  return 'none';
}

// GET /api/users/me
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  res.json({ user: publicUser(user), photos: photosFor(req.userId) });
});

// PUT /api/users/me
router.put('/me', requireAuth, (req, res, next) => {
  try {
    const data = parse(updateProfileSchema, req.body);
    const fields = Object.keys(data);
    if (fields.length === 0) return res.json({ ok: true });
    const set = fields.map((f) => `${f} = ?`).join(', ');
    const vals = fields.map((f) => data[f]);
    db.prepare(`UPDATE users SET ${set}, updated_at = strftime('%s','now') WHERE id = ?`)
      .run(...vals, req.userId);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
    res.json({ user: publicUser(user), photos: photosFor(req.userId) });
  } catch (e) { next(e); }
});

// POST /api/users/me/photos
router.post('/me/photos', requireAuth, upload.single('photo'), (req, res, next) => {
  try {
    if (!req.file) { const e = new Error('no file uploaded'); e.status = 400; e.expose = true; throw e; }
    const existing = db.prepare('SELECT COUNT(*) AS n FROM photos WHERE user_id = ?').get(req.userId).n;
    if (existing >= MAX_PHOTOS) {
      fs.unlinkSync(path.join(UPLOAD_DIR, req.file.filename));
      const e = new Error(`max ${MAX_PHOTOS} photos per user`); e.status = 400; e.expose = true; throw e;
    }
    const isPrimary = existing === 0 ? 1 : 0;
    const info = db.prepare(
      'INSERT INTO photos (user_id, filename, is_primary, sort_order) VALUES (?, ?, ?, ?)'
    ).run(req.userId, req.file.filename, isPrimary, existing);
    const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(info.lastInsertRowid);
    res.json({ photo, photos: photosFor(req.userId) });
  } catch (e) { next(e); }
});

// DELETE /api/users/me/photos/:photoId
router.delete('/me/photos/:photoId', requireAuth, (req, res, next) => {
  try {
    const photoId = Number(req.params.photoId);
    const photo = db.prepare('SELECT * FROM photos WHERE id = ? AND user_id = ?').get(photoId, req.userId);
    if (!photo) { const e = new Error('photo not found'); e.status = 404; e.expose = true; throw e; }
    db.prepare('DELETE FROM photos WHERE id = ?').run(photoId);
    const abs = path.join(UPLOAD_DIR, photo.filename);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
    if (photo.is_primary) {
      const next = db.prepare('SELECT id FROM photos WHERE user_id = ? ORDER BY sort_order ASC, id ASC LIMIT 1').get(req.userId);
      if (next) db.prepare('UPDATE photos SET is_primary = 1 WHERE id = ?').run(next.id);
    }
    res.json({ photos: photosFor(req.userId) });
  } catch (e) { next(e); }
});

// PUT /api/users/me/photos/:photoId/primary
router.put('/me/photos/:photoId/primary', requireAuth, (req, res, next) => {
  try {
    const photoId = Number(req.params.photoId);
    const photo = db.prepare('SELECT id FROM photos WHERE id = ? AND user_id = ?').get(photoId, req.userId);
    if (!photo) { const e = new Error('photo not found'); e.status = 404; e.expose = true; throw e; }
    const tx = db.transaction(() => {
      db.prepare('UPDATE photos SET is_primary = 0 WHERE user_id = ?').run(req.userId);
      db.prepare('UPDATE photos SET is_primary = 1 WHERE id = ?').run(photoId);
    });
    tx();
    res.json({ photos: photosFor(req.userId) });
  } catch (e) { next(e); }
});

// PUT /api/users/me/photos/order  body: { photo_ids: [id, id, ...] }
router.put('/me/photos/order', requireAuth, (req, res, next) => {
  try {
    const { photo_ids } = parse(photoOrderSchema, req.body);
    const owned = db.prepare('SELECT id FROM photos WHERE user_id = ?').all(req.userId).map((r) => r.id);
    const valid = photo_ids.filter((id) => owned.includes(id));
    const tx = db.transaction(() => {
      valid.forEach((id, i) => db.prepare('UPDATE photos SET sort_order = ? WHERE id = ?').run(i, id));
    });
    tx();
    res.json({ photos: photosFor(req.userId) });
  } catch (e) { next(e); }
});

// GET /api/users/:id
router.get('/:id', requireAuth, (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const blocked = db.prepare(
      'SELECT 1 FROM blocks WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)'
    ).get(req.userId, id, id, req.userId);
    if (blocked) { const e = new Error('user not found'); e.status = 404; e.expose = true; throw e; }
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) { const e = new Error('user not found'); e.status = 404; e.expose = true; throw e; }
    res.json({
      user: publicUser(user),
      photos: photosFor(id),
      connection_status: connectionStatus(req.userId, id),
    });
  } catch (e) { next(e); }
});

module.exports = router;
module.exports.photosFor = photosFor;
module.exports.connectionStatus = connectionStatus;
