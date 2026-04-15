const express = require('express');
const db = require('../db');
const { hashPassword, verifyPassword, signToken } = require('../auth');
const { parse, signupSchema, loginSchema } = require('../validators');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    display_name: row.display_name,
    age: row.age,
    gender: row.gender,
    seeking_gender: row.seeking_gender,
    location: row.location || '',
    who_i_am: row.who_i_am || '',
    who_i_want_to_be: row.who_i_want_to_be || '',
    what_im_looking_for: row.what_im_looking_for || '',
  };
}

router.post('/signup', async (req, res, next) => {
  try {
    const data = parse(signupSchema, req.body);
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email);
    if (existing) {
      const e = new Error('that email is already registered');
      e.status = 409; e.expose = true; throw e;
    }
    const hash = await hashPassword(data.password);
    const info = db.prepare(`
      INSERT INTO users (email, password_hash, display_name, age, gender, seeking_gender, location)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(data.email, hash, data.display_name, data.age, data.gender, data.seeking_gender, data.location || '');
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    const token = signToken(user.id);
    res.json({ token, user: publicUser(user) });
  } catch (e) { next(e); }
});

router.post('/login', async (req, res, next) => {
  try {
    const data = parse(loginSchema, req.body);
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(data.email);
    if (!user) {
      const e = new Error('invalid credentials');
      e.status = 401; e.expose = true; throw e;
    }
    const ok = await verifyPassword(data.password, user.password_hash);
    if (!ok) {
      const e = new Error('invalid credentials');
      e.status = 401; e.expose = true; throw e;
    }
    const token = signToken(user.id);
    res.json({ token, user: publicUser(user) });
  } catch (e) { next(e); }
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  res.json({ user: publicUser(user) });
});

module.exports = router;
module.exports.publicUser = publicUser;
