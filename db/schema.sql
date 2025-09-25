-- ========= DROP (in dependency order) =========
DROP TABLE IF EXISTS trades CASCADE;
DROP TABLE IF EXISTS response_items CASCADE;
DROP TABLE IF EXISTS responses CASCADE;
DROP TABLE IF EXISTS post_items CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ========= USERS =========
CREATE TABLE users (
  id                SERIAL PRIMARY KEY,
  first_name        TEXT        NOT NULL,
  last_name         TEXT        NOT NULL,
  bio               TEXT        DEFAULT 'no bio provided',
  username          TEXT        NOT NULL UNIQUE,
  password          TEXT        NOT NULL,
  profile_image_url TEXT        NOT NULL,
  location          TEXT        DEFAULT 'no location provided',
  created_at        TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ========= CATEGORIES =========
CREATE TABLE categories (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE
);

-- ========= POSTS =========
CREATE TABLE posts (
  id           SERIAL PRIMARY KEY,
  author_id    INTEGER   NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  category_id  INTEGER   NOT NULL REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  title        TEXT      NOT NULL,
  description  TEXT      DEFAULT 'no description provided',
  status       TEXT      DEFAULT 'open', -- values: open, closed, traded
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP
);

-- Helpful indexes
CREATE INDEX posts_author_id_idx   ON posts(author_id);
CREATE INDEX posts_category_id_idx ON posts(category_id);

-- ========= POST ITEMS =========
CREATE TABLE post_items (
  id          SERIAL PRIMARY KEY,
  post_id     INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE ON UPDATE CASCADE,
  name        TEXT    NOT NULL,
  description TEXT    DEFAULT 'no description provided',
  condition   TEXT,
  image_url   TEXT,
  quantity    INTEGER DEFAULT 1
);

CREATE INDEX post_items_post_id_idx ON post_items(post_id);

-- ========= RESPONSES (OFFERS) =========
CREATE TABLE responses (
  id             SERIAL PRIMARY KEY,
  post_id        INTEGER   NOT NULL REFERENCES posts(id) ON DELETE CASCADE ON UPDATE CASCADE,
  author_id      INTEGER   NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  child_post_id  INTEGER            REFERENCES posts(id) ON DELETE SET NULL ON UPDATE CASCADE, -- NEW
  message        TEXT      DEFAULT 'no message provided',
  status         TEXT      DEFAULT 'pending', -- values: pending, accepted, rejected
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX responses_post_id_idx        ON responses(post_id);
CREATE INDEX responses_author_id_idx      ON responses(author_id);
CREATE INDEX responses_child_post_id_idx  ON responses(child_post_id);

-- ========= RESPONSE ITEMS =========
CREATE TABLE response_items (
  id           SERIAL PRIMARY KEY,
  response_id  INTEGER NOT NULL REFERENCES responses(id) ON DELETE CASCADE ON UPDATE CASCADE,
  name         TEXT    NOT NULL,
  description  TEXT    DEFAULT 'no description provided.',
  condition    TEXT    NOT NULL,
  image_url    TEXT,
  quantity     INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX response_items_response_id_idx ON response_items(response_id);

-- ========= TRADES =========
CREATE TABLE trades (
  id          SERIAL PRIMARY KEY,
  post_id     INTEGER   NOT NULL REFERENCES posts(id) ON DELETE CASCADE ON UPDATE CASCADE,
  response_id INTEGER   NOT NULL REFERENCES responses(id) ON DELETE CASCADE ON UPDATE CASCADE,
  agreed_at   TIMESTAMP,
  status      TEXT      DEFAULT 'completed' -- values: completed, cancelled
);

CREATE INDEX trades_post_id_idx     ON trades(post_id);
CREATE INDEX trades_response_id_idx ON trades(response_id);
