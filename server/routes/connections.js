const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');
const { parse, connectSchema } = require('../validators');

const router = express.Router();

function isMutual(a, b) {
  const r1 = db.prepare('SELECT 1 FROM connections WHERE from_user_id = ? AND to_user_id = ?').get(a, b);
  const r2 = db.prepare('SELECT 1 FROM connections WHERE from_user_id = ? AND to_user_id = ?').get(b, a);
  return !!(r1 && r2);
}

// POST /api/connections  body: { to_user_id }
// Idempotent: inserting an existing row is a no-op.
router.post('/', requireAuth, (req, res, next) => {
  try {
    const { to_user_id } = parse(connectSchema, req.body);
    if (to_user_id === req.userId) {
      const e = new Error("you can't connect with yourself"); e.status = 400; e.expose = true; throw e;
    }
    const target = db.prepare('SELECT id FROM users WHERE id = ?').get(to_user_id);
    if (!target) {
      const e = new Error('user not found'); e.status = 404; e.expose = true; throw e;
    }
    db.prepare(`
      INSERT OR IGNORE INTO connections (from_user_id, to_user_id)
      VALUES (?, ?)
    `).run(req.userId, to_user_id);
    const mutual = isMutual(req.userId, to_user_id);
    res.json({ ok: true, mutual, connection_status: mutual ? 'mutual' : 'outgoing_pending' });
  } catch (e) { next(e); }
});

// DELETE /api/connections/:toUserId - withdraw
router.delete('/:toUserId', requireAuth, (req, res) => {
  const toUserId = Number(req.params.toUserId);
  db.prepare('DELETE FROM connections WHERE from_user_id = ? AND to_user_id = ?')
    .run(req.userId, toUserId);
  // After withdrawing, any inverse row still stands as an incoming_pending from the other side.
  const incoming = db.prepare('SELECT 1 FROM connections WHERE from_user_id = ? AND to_user_id = ?')
    .get(toUserId, req.userId);
  res.json({ ok: true, connection_status: incoming ? 'incoming_pending' : 'none' });
});

// GET /api/connections/mutual - chat list
router.get('/mutual', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT u.id, u.display_name, u.age, u.location,
           (SELECT filename FROM photos p WHERE p.user_id = u.id ORDER BY p.is_primary DESC, p.sort_order ASC, p.id ASC LIMIT 1) AS primary_photo,
           (SELECT body FROM messages m
              WHERE (m.from_user_id = @me AND m.to_user_id = u.id)
                 OR (m.from_user_id = u.id AND m.to_user_id = @me)
              ORDER BY m.created_at DESC LIMIT 1) AS last_message,
           (SELECT created_at FROM messages m
              WHERE (m.from_user_id = @me AND m.to_user_id = u.id)
                 OR (m.from_user_id = u.id AND m.to_user_id = @me)
              ORDER BY m.created_at DESC LIMIT 1) AS last_at,
           (SELECT COUNT(*) FROM messages m
              WHERE m.from_user_id = u.id AND m.to_user_id = @me AND m.read_at IS NULL) AS unread_count
    FROM users u
    WHERE u.id IN (SELECT to_user_id FROM connections WHERE from_user_id = @me)
      AND u.id IN (SELECT from_user_id FROM connections WHERE to_user_id = @me)
    ORDER BY COALESCE(last_at, 0) DESC, u.id ASC
  `).all({ me: req.userId });
  res.json({ connections: rows });
});

// GET /api/connections/incoming - people who connected to me, I haven't back
router.get('/incoming', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT u.id, u.display_name, u.age, u.location,
           (SELECT filename FROM photos p WHERE p.user_id = u.id ORDER BY p.is_primary DESC, p.sort_order ASC, p.id ASC LIMIT 1) AS primary_photo,
           c.created_at AS requested_at
    FROM users u
    JOIN connections c ON c.from_user_id = u.id AND c.to_user_id = @me
    WHERE u.id NOT IN (SELECT to_user_id FROM connections WHERE from_user_id = @me)
    ORDER BY c.created_at DESC
  `).all({ me: req.userId });
  res.json({ incoming: rows });
});

module.exports = router;
module.exports.isMutual = isMutual;
