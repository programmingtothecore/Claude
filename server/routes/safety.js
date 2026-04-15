const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');
const { parse, blockSchema, reportSchema } = require('../validators');

const router = express.Router();

// Block another user. Blocks are symmetric in visibility:
// neither user can see/contact the other afterwards.
// Also deletes any existing connections between them.
router.post('/block', requireAuth, (req, res, next) => {
  try {
    const { user_id } = parse(blockSchema, req.body);
    if (user_id === req.userId) {
      const e = new Error("can't block yourself"); e.status = 400; e.expose = true; throw e;
    }
    const target = db.prepare('SELECT id FROM users WHERE id = ?').get(user_id);
    if (!target) { const e = new Error('user not found'); e.status = 404; e.expose = true; throw e; }
    const tx = db.transaction(() => {
      db.prepare('INSERT OR IGNORE INTO blocks (blocker_id, blocked_id) VALUES (?, ?)').run(req.userId, user_id);
      db.prepare('DELETE FROM connections WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?)')
        .run(req.userId, user_id, user_id, req.userId);
    });
    tx();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.delete('/block/:userId', requireAuth, (req, res) => {
  const uid = Number(req.params.userId);
  db.prepare('DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?').run(req.userId, uid);
  res.json({ ok: true });
});

router.get('/blocks', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT u.id, u.display_name,
           (SELECT filename FROM photos p WHERE p.user_id = u.id ORDER BY p.is_primary DESC, p.sort_order ASC, p.id ASC LIMIT 1) AS primary_photo,
           b.created_at
    FROM blocks b JOIN users u ON u.id = b.blocked_id
    WHERE b.blocker_id = ?
    ORDER BY b.created_at DESC
  `).all(req.userId);
  res.json({ blocks: rows });
});

router.post('/report', requireAuth, (req, res, next) => {
  try {
    const data = parse(reportSchema, req.body);
    if (data.user_id === req.userId) {
      const e = new Error("can't report yourself"); e.status = 400; e.expose = true; throw e;
    }
    const target = db.prepare('SELECT id FROM users WHERE id = ?').get(data.user_id);
    if (!target) { const e = new Error('user not found'); e.status = 404; e.expose = true; throw e; }
    db.prepare(`
      INSERT INTO reports (reporter_id, reported_id, reason, details)
      VALUES (?, ?, ?, ?)
    `).run(req.userId, data.user_id, data.reason, data.details || '');
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
