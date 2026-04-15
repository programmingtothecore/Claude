const { Server } = require('socket.io');
const { verifyToken } = require('./auth');
const db = require('./db');
const { isMutual } = require('./routes/connections');

// Map userId -> Set of socket IDs  (for presence)
const onlineUsers = new Map();

function setOnline(userId, socketId) {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
}

function setOffline(userId, socketId) {
  const s = onlineUsers.get(userId);
  if (!s) return;
  s.delete(socketId);
  if (s.size === 0) onlineUsers.delete(userId);
}

function isOnline(userId) {
  const s = onlineUsers.get(userId);
  return !!(s && s.size > 0);
}

function attachSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) return next(new Error('auth required'));
    const userId = verifyToken(token);
    if (!userId) return next(new Error('invalid token'));
    socket.userId = userId;
    next();
  });

  io.on('connection', (socket) => {
    const uid = socket.userId;
    socket.join(`user:${uid}`);
    setOnline(uid, socket.id);

    // Update last_seen_at
    db.prepare("UPDATE users SET last_seen_at = strftime('%s','now') WHERE id = ?").run(uid);

    // Broadcast to mutual connections that this user is online
    const mutuals = db.prepare(`
      SELECT from_user_id AS partner_id FROM connections WHERE to_user_id = ?
      INTERSECT
      SELECT to_user_id   AS partner_id FROM connections WHERE from_user_id = ?
    `).all(uid, uid);
    for (const { partner_id } of mutuals) {
      io.to(`user:${partner_id}`).emit('presence', { user_id: uid, online: true });
    }

    // ── message:send ──────────────────────────────────────────────────────────
    socket.on('message:send', (payload, ack) => {
      try {
        const to = Number(payload && payload.to_user_id);
        const body = String((payload && payload.body) || '').trim();
        if (!to || !body) throw new Error('bad payload');
        if (body.length > 2000) throw new Error('message too long');
        if (!isMutual(uid, to)) throw new Error('not mutually connected');
        const info = db.prepare(
          'INSERT INTO messages (from_user_id, to_user_id, body) VALUES (?, ?, ?)'
        ).run(uid, to, body);
        const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(info.lastInsertRowid);
        io.to(`user:${msg.from_user_id}`).emit('message:new', msg);
        io.to(`user:${msg.to_user_id}`).emit('message:new', msg);
        if (typeof ack === 'function') ack({ ok: true, message: msg });
      } catch (e) {
        if (typeof ack === 'function') ack({ ok: false, error: e.message });
      }
    });

    // ── typing ────────────────────────────────────────────────────────────────
    socket.on('typing', (payload) => {
      const to = Number(payload && payload.to_user_id);
      if (!to) return;
      io.to(`user:${to}`).emit('typing:from', { from_user_id: uid });
    });

    // ── read receipt ──────────────────────────────────────────────────────────
    // Client emits this when it marks messages as read via REST; we forward
    // the signal to the sender so they can update the "Read" tick in their chat.
    socket.on('message:read', (payload) => {
      const { from_user_id, up_to_id } = payload || {};
      if (!from_user_id || !up_to_id) return;
      io.to(`user:${from_user_id}`).emit('message:read', {
        reader_id: uid,
        up_to_id: Number(up_to_id),
      });
    });

    // ── presence query ────────────────────────────────────────────────────────
    socket.on('presence:query', (payload, ack) => {
      const userId = Number(payload && payload.user_id);
      if (typeof ack === 'function') ack(isOnline(userId));
    });

    // ── disconnect ────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      setOffline(uid, socket.id);
      db.prepare("UPDATE users SET last_seen_at = strftime('%s','now') WHERE id = ?").run(uid);
      if (!isOnline(uid)) {
        for (const { partner_id } of mutuals) {
          io.to(`user:${partner_id}`).emit('presence', { user_id: uid, online: false });
        }
      }
    });
  });

  return io;
}

module.exports = attachSockets;
