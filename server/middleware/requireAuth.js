const { verifyToken } = require('../auth');
const db = require('../db');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) return res.status(401).json({ error: 'missing token' });

  const userId = verifyToken(m[1]);
  if (!userId) return res.status(401).json({ error: 'invalid token' });

  const user = db.prepare('SELECT id, email, display_name FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(401).json({ error: 'user not found' });

  req.userId = user.id;
  req.user = user;
  next();
}

module.exports = requireAuth;
