// /api/usersRouter.js
import express from 'express';

import {
  getUserById,
  loginUser,
  registerUser,
} from '#api/controllers/userController';
import requireBody from '#middleware/requireBody';

const router = express.Router();

//  GET /api/users/:id
router.get('/:id', getUserById);

// POST /api/users/register
router.post(
  '/register',
  requireBody(['username', 'email', 'password']),
  registerUser
);

//  POST /api/users/login
router.post('/login', requireBody(['email', 'password']), loginUser);

export default router;
