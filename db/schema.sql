-- Drop tables in dependency order with CASCADE
DROP TABLE IF EXISTS trades CASCADE;

DROP TABLE IF EXISTS response_items CASCADE;

DROP TABLE IF EXISTS responses CASCADE;

DROP TABLE IF EXISTS post_items CASCADE;

DROP TABLE IF EXISTS posts CASCADE;

DROP TABLE IF EXISTS users CASCADE;

-- -- Users
-- CREATE TABLE users (
--   id serial PRIMARY KEY,
--   username TEXT UNIQUE NOT NULL,
--   password TEXT NOT NULL,
--   profile_image_url TEXT NOT NULL,
--   location TEXT NOT NULL,
--   created_at TIMESTAMP NOT NULL DEFAULT NOW()
-- );

-- -- Posts
-- CREATE TABLE posts (
--   id serial PRIMARY KEY,
--   posted_by INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
--   title TEXT NOT NULL,
--   description TEXT NOT NULL,
--   status TEXT DEFAULT 'open', -- values: open, closed, traded
--   created_at TIMESTAMP DEFAULT NOW(),
--   updated_at TIMESTAMP
-- );

-- -- Post Items
-- CREATE TABLE post_items (
--   id serial PRIMARY KEY,
--   post_id INTEGER NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
--   name TEXT NOT NULL,
--   description TEXT,
--   condition TEXT,
--   image_url TEXT,
--   quantity INTEGER DEFAULT 1
-- );

-- -- Responses
-- CREATE TABLE responses (
--   id serial PRIMARY KEY,
--   post_id INTEGER NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
--   user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
--   message TEXT,
--   status TEXT DEFAULT 'pending', -- values: pending, accepted, rejected
--   created_at TIMESTAMP DEFAULT NOW()
-- );

-- -- Response Items
-- CREATE TABLE response_items (
--   id serial PRIMARY KEY,
--   response_id INTEGER NOT NULL REFERENCES responses (id) ON DELETE CASCADE,
--   name TEXT NOT NULL,
--   description TEXT,
--   condition TEXT,
--   image_url TEXT,
--   quantity INTEGER NOT NULL DEFAULT 1
-- );

-- -- Trades
-- CREATE TABLE trades (
--   id serial PRIMARY KEY,
--   post_id INTEGER NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
--   response_id INTEGER NOT NULL REFERENCES responses (id) ON DELETE CASCADE,
--   agreed_at TIMESTAMP,
--   status TEXT DEFAULT 'completed' -- values: completed, cancelled
-- );
