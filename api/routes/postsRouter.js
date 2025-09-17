// /api/postsRouter.js
import express from 'express';

import {
  createPost,
  deletePost,
  getPostById,
  getPosts,
  updatePost,
} from '#api/controllers/postController';
import requireBody from '#middleware/requireBody';
import requireUser from '#middleware/requireUser';

const router = express.Router();

// GET /api/posts
router.get('/', getPosts);

// GET /api/posts/:id
router.get('/:id', getPostById);

// POST /api/posts
router.post('/', requireUser, requireBody(['title', 'items']), createPost);

// PUT /api/posts/:id
router.put('/:id', requireUser, updatePost);

// DELETE /api/posts/:id
router.delete('/:id', requireUser, deletePost);

export default router;
