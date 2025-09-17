// /db/queries/userQueries.js
import db from '#db/client';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

// CREATE Register
export const createUser = async (username, email, password, profileImageUrl = null, location = null) => {
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const sql = `
    INSERT INTO users (username, email, password_hash, profile_image_url, location, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING id, username, email, profile_image_url, location, created_at
  `;
  const { rows } = await db.query(sql, [username, email, hashed, profileImageUrl, location]);
  return rows[0];
};

// READ by id
export const getUserById = async (id) => {
  const { rows } = await db.query(
    `SELECT id, username, email, profile_image_url, location, created_at
     FROM users WHERE id = $1`,
    [id]
  );
  return rows[0];
};

// Auth helper (used in login)
export const getUserByCredentials = async (email, password) => {
  const { rows } = await db.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  const user = rows[0];
  if (!user) return null;

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;


  return {
    id: user.id,
    username: user.username,
    email: user.email,
    profile_image_url: user.profile_image_url,
    location: user.location,
    created_at: user.created_at,
  };
};