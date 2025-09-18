// /api/postsRouter.js
import {
  createPostWithItems,
  deletePostByOwner,
  getPostById,
  listPosts,
  updatePostByOwner,
} from '#db/queries/postQueries';
import requireBody from '#middleware/requireBody';
import requireUser from '#middleware/requireUser';
import express from 'express';

const router = express.Router();

// GET /api/posts
router.get('/', async (req, res, next) => {
  try {
    const rows = await listPosts(req.query);
    res.send(rows);
  } catch (e) {
    next(e);
  }
});

// GET /api/posts/:id
router.get('/:id', async (req, res, next) => {
  try {
    const post = await getPostById(Number(req.params.id));
    if (!post) return res.status(404).send('Post not found');
    res.send(post);
  } catch (e) {
    next(e);
  }
});

// POST /api/posts
router.post(
  '/',
  requireUser,
  requireBody(['title', 'items']),
  async (req, res, next) => {
    try {
      const { title, description = '', items } = req.body;
      if (!Array.isArray(items) || items.length === 0)
        return res.status(400).send('items array required');

      const post = await createPostWithItems({
        userId: req.user.id,
        title,
        description,
        items,
      });
      res.status(201).send(post);
    } catch (e) {
      next(e);
    }
  }
);

// PATCH /api/posts/:id
router.patch('/:id', requireUser, async (req, res, next) => {
  try {
    const updated = await updatePostByOwner({
      id: Number(req.params.id),
      ownerId: req.user.id,
      fields: req.body,
    });
    res.send(updated);
  } catch (e) {
    next(e);
  }
});

// DELETE /api/posts/:id
router.delete('/:id', requireUser, async (req, res, next) => {
  try {
    await deletePostByOwner({
      id: Number(req.params.id),
      ownerId: req.user.id,
    });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

export default router;
