// /api/usersRouter.js
import express from 'express';

import {
  createUser,
  getUserByCredentials,
  getUserById,
} from '#db/queries/userQueries';
import requireBody from '#middleware/requireBody';
import { createToken } from '#utils/jwt';

const router = express.Router();

//  GET /api/users/:id
router.get('/:id', async (req, res, next) => {
  try {
    const user = await getUserById(Number(req.params.id));
    if (!user) return res.status(404).send('User not found');

    res.send(user);
  } catch (e) {
    next(e);
  }
});

// POST /api/users/register
router.post(
  '/register',
  requireBody(['username', 'email', 'password']),
  async (req, res, next) => {
    try {
      const { username, email, password, profile_image_url, location } =
        req.body;
      const user = await createUser(
        username,
        email,
        password,
        profile_image_url,
        location
      );
      const token = createToken({ id: user.id, username: user.username });

      res.status(201).send({ token, user });
    } catch (e) {
      next(e);
    }
  }
);

//  POST /api/users/login
router.post(
  '/login',
  requireBody(['email', 'password']),
  async (req, res, next) => {
    try {
      const user = await getUserByCredentials(
        req.body.email,
        req.body.password
      );
      if (!user) return res.status(401).send('Invalid email or password');

      const token = createToken({ id: user.id, username: user.username });

      res.send({ token, user });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
