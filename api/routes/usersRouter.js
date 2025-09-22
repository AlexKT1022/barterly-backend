// /api/usersRouter.js
import express from 'express';
import requireBody from '#middleware/requireBody';
import { createToken } from '#utils/jwt';
import requireUser from '#middleware/requireUser';
import {
  createUser,
  getUserById,
  getUserByCredentials,
  // new options specifically for the page Nick is working on:
  getMe,
  updateMe,
  changeMyPassword,
  listMyPosts,
  getMyActivity,
  listUsers,
  listUserPosts, 
} from '#db/queries/userQueries';

const router = express.Router();

/* -------------------- “me” routes (must come before :id) -------------------- */

// GET /api/users/me  → full profile for current user
router.get('/me', requireUser, async (req, res, next) => {
  try {
    res.send(await getMe(req.user.id));
  } catch (e) {
    next(e);
  }
});

// PATCH /api/users/me  → update profile fields (username, profile_image_url, location, first_name, last_name, bio)
router.patch('/me', requireUser, async (req, res, next) => {
  try {
    res.send(await updateMe(req.user.id, req.body));
  } catch (e) {
    next(e);
  }
});

// PATCH /api/users/me/password  → change password
router.patch(
  '/me/password',
  requireUser,
  requireBody(['old_password', 'new_password']),
  async (req, res, next) => {
    try {
      const { old_password, new_password } = req.body;
      await changeMyPassword(req.user.id, old_password, new_password);
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  }
);

// GET /api/users/me/posts?status=&limit=&offset=
router.get('/me/posts', requireUser, async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20) || 20));
    const offset = Math.max(0, Number(req.query.offset ?? 0) || 0);
    const status = req.query.status;
    const allowedStatus = new Set(['open', 'trading', 'closed']);
    const filt = allowedStatus.has(status) ? status : undefined;

    const result = await listMyPosts(req.user.id, { status: filt, limit, offset });
    res.send(result);
  } catch (e) {
    next(e);
  }
});

// GET /api/users/me/activity?limit=&offset=
router.get('/me/activity', requireUser, async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20) || 20));
    const offset = Math.max(0, Number(req.query.offset ?? 0) || 0);
    const result = await getMyActivity(req.user.id, { limit, offset });
    res.send(result);
  } catch (e) {
    next(e);
  }
});

/* -------------------- public user routes -------------------- */

// GET /api/users?q=&limit=&offset=
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 50) || 50));
    const offset = Math.max(0, Number(req.query.offset ?? 0) || 0);
    const q = req.query.q?.toString() || undefined;
    const result = await listUsers({ q, limit, offset });
    res.send(result);
  } catch (e) {
    next(e);
  }
});

// GET /api/users/:id/posts  (this needs to be before /:id, removed regex)
router.get('/:id/posts', async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId)) {
      return res.status(400).send('User id must be a number');
    }

    // 404 if user doesn't exist
    const exists = await getUserById(userId);
    if (!exists) return res.status(404).send('User not found');

    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20) || 20));
    const offset = Math.max(0, Number(req.query.offset ?? 0) || 0);
    const allowed = new Set(['open', 'trading', 'closed']);
    const status = allowed.has(req.query.status) ? req.query.status : undefined;

    const result = await listUserPosts(userId, { status, limit, offset });
    res.send(result);
  } catch (e) {
    next(e);
  }
});

// GET /api/users/:id  (numeric only to avoid conflict with "me")
router.get('/:id(\\d+)', async (req, res, next) => {
  try {
    const user = await getUserById(Number(req.params.id));
    if (!user) return res.status(404).send('User not found');
    res.send(user);
  } catch (e) {
    next(e);
  }
});

/* -------------------- auth -------------------- */

// POST /api/users/register
router.post(
  '/register',
  // new schema requires first_name + last_name + username + password
  requireBody(['first_name', 'last_name', 'username', 'password']),
  async (req, res, next) => {
    try {
      const {
        first_name,
        last_name,
        username,
        password,
        bio,                 // optional (defaults in schema)
        profile_image_url,   // optional
        location,            // optional (defaults in schema)
      } = req.body;

      const user = await createUser({
        first_name,
        last_name,
        username,
        password,
        bio,
        profile_image_url,
        location,
      });

      const token = createToken({ id: user.id, username: user.username });
      res.status(201).send({ token, user });
    } catch (e) {
      // surface duplicate username 
      if (e?.code === 'P2002' || e?.status === 409) {
        return res.status(409).send({ error: 'Username is already taken' });
      }
      next(e);
    }
  }
);

// POST /api/users/login
router.post(
  '/login',
  requireBody(['username', 'password']),
  async (req, res, next) => {
    try {
      const user = await getUserByCredentials(req.body.username, req.body.password);
      if (!user) return res.status(401).send('Invalid username or password');
      const token = createToken({ id: user.id, username: user.username });
      res.send({ token, user });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
