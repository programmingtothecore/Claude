CREATE TABLE IF NOT EXISTS users (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  email               TEXT    NOT NULL UNIQUE,
  password_hash       TEXT    NOT NULL,
  display_name        TEXT    NOT NULL,
  age                 INTEGER NOT NULL CHECK(age >= 18),
  gender              TEXT    NOT NULL CHECK(gender IN ('male','female','nonbinary','other')),
  seeking_gender      TEXT    NOT NULL CHECK(seeking_gender IN ('male','female','nonbinary','any')),
  location            TEXT,
  who_i_am            TEXT DEFAULT '',
  who_i_want_to_be    TEXT DEFAULT '',
  what_im_looking_for TEXT DEFAULT '',
  seeking_age_min     INTEGER NOT NULL DEFAULT 18,
  seeking_age_max     INTEGER NOT NULL DEFAULT 99,
  last_seen_at        INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  created_at          INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_at          INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE TABLE IF NOT EXISTS photos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename   TEXT    NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);
CREATE INDEX IF NOT EXISTS idx_photos_user ON photos(user_id);

CREATE TABLE IF NOT EXISTS connections (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  UNIQUE(from_user_id, to_user_id),
  CHECK(from_user_id <> to_user_id)
);
CREATE INDEX IF NOT EXISTS idx_conn_from ON connections(from_user_id);
CREATE INDEX IF NOT EXISTS idx_conn_to   ON connections(to_user_id);

CREATE TABLE IF NOT EXISTS messages (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body         TEXT    NOT NULL,
  created_at   INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  read_at      INTEGER
);
CREATE INDEX IF NOT EXISTS idx_msg_pair ON messages(from_user_id, to_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_msg_to   ON messages(to_user_id, read_at);

-- One-way block. If A blocks B: B is hidden from A's Explore, they can't connect,
-- any existing connections are removed, messages are hidden.
CREATE TABLE IF NOT EXISTS blocks (
  blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  PRIMARY KEY (blocker_id, blocked_id)
);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_id);

CREATE TABLE IF NOT EXISTS reports (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason       TEXT NOT NULL,
  details      TEXT DEFAULT '',
  created_at   INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  resolved_at  INTEGER
);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_id);

CREATE TABLE IF NOT EXISTS password_resets (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  used_at    INTEGER
);
CREATE INDEX IF NOT EXISTS idx_resets_token ON password_resets(token);

-- Defensive migration: if users existed before the preference columns were added,
-- backfill them (SQLite ALTER TABLE ADD COLUMN is a no-op if it already exists? No,
-- it errors. The IF NOT EXISTS in the CREATE TABLE above only runs for fresh DBs.
-- So we don't ALTER here; fresh DB creation is the expected path.)
