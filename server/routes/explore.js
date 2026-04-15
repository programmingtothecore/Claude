const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// GET /api/explore?cursor=&limit=&age_min=&age_max=
// Mutual gender-seeking match; exclude self, already-connected, and blocked.
router.get('/', requireAuth, (req, res) => {
  const me = db.prepare('SELECT id, gender, seeking_gender, seeking_age_min, seeking_age_max FROM users WHERE id = ?').get(req.userId);
  const cursor = Number(req.query.cursor) || 0;
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
  const ageMin = Number(req.query.age_min) || me.seeking_age_min || 18;
  const ageMax = Number(req.query.age_max) || me.seeking_age_max || 99;

  const params = { me: me.id, cursor, limit, ageMin, ageMax };
  let myGenderClause;
  if (me.seeking_gender === 'any') {
    myGenderClause = '1=1';
  } else {
    myGenderClause = 'u.gender = @mySeeking';
    params.mySeeking = me.seeking_gender;
  }
  const theirSeekingClause = "(u.seeking_gender = 'any' OR u.seeking_gender = @myGender)";
  params.myGender = me.gender;

  const rows = db.prepare(`
    SELECT
      u.id, u.display_name, u.age, u.gender, u.location,
      u.who_i_am, u.who_i_want_to_be, u.what_im_looking_for,
      (SELECT filename FROM photos p WHERE p.user_id = u.id
       ORDER BY p.is_primary DESC, p.sort_order ASC, p.id ASC LIMIT 1) AS primary_photo
    FROM users u
    WHERE u.id <> @me
      AND ${myGenderClause}
      AND ${theirSeekingClause}
      AND u.age >= @ageMin AND u.age <= @ageMax
      AND u.id NOT IN (SELECT to_user_id   FROM connections WHERE from_user_id = @me)
      AND u.id NOT IN (SELECT blocked_id   FROM blocks     WHERE blocker_id   = @me)
      AND u.id NOT IN (SELECT blocker_id   FROM blocks     WHERE blocked_id   = @me)
      AND (@cursor = 0 OR u.id > @cursor)
    ORDER BY u.id ASC
    LIMIT @limit
  `).all(params);

  const nextCursor = rows.length === limit ? rows[rows.length - 1].id : null;
  res.json({ users: rows, next_cursor: nextCursor });
});

module.exports = router;
