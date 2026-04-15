const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');
const { parse, messageSchema } = require('../validators');
const { isMutual } = require('./connections');

const router = express.Router();

function buildMessagesRouter({ io }) {
  // GET /api/messages/:otherUserId?before=&limit=
  router.get('/:otherUserId', requireAuth, (req, res) => {
    const other = Number(req.params.otherUserId);
    if (!isMutual(req.userId, other)) {
      return res.status(403).json({ error: 'not mutually connected' });
    }
    const before = Number(req.query.before) || 0;
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const rows = db.prepare(`
      SELECT id, from_user_id, to_user_id, body, created_at, read_at
      FROM messages
      WHERE ((from_user_id = @me AND to_user_id = @other)
          OR (from_user_id = @other AND to_user_id = @me))
        AND (@before = 0 OR id < @before)
      ORDER BY id DESC
      LIMIT @limit
    `).all({ me: req.userId, other, before, limit });
    res.json({ messages: rows.reverse() });
  });

  // POST /api/messages
  router.post('/', requireAuth, (req, res, next) => {
    try {
      const data = parse(messageSchema, req.body);
      if (!isMutual(req.userId, data.to_user_id)) {
        const e = new Error('not mutually connected'); e.status = 403; e.expose = true; throw e;
      }
      const info = db.prepare(`
        INSERT INTO messages (from_user_id, to_user_id, body)
        VALUES (?, ?, ?)
      `).run(req.userId, data.to_user_id, data.body.trim());
      const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(info.lastInsertRowid);
      if (io) {
        io.to(`user:${msg.from_user_id}`).emit('message:new', msg);
        io.to(`user:${msg.to_user_id}`).emit('message:new', msg);
      }
      res.json({ message: msg });
    } catch (e) { next(e); }
  });

  // POST /api/messages/:otherUserId/read
  router.post('/:otherUserId/read', requireAuth, (req, res) => {
    const other = Number(req.params.otherUserId);
    db.prepare(`
      UPDATE messages SET read_at = strftime('%s','now')
      WHERE from_user_id = ? AND to_user_id = ? AND read_at IS NULL
    `).run(other, req.userId);
    res.json({ ok: true });
  });

  return router;
}

module.exports = buildMessagesRouter;
