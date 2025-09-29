import express from 'express';

import requireUser from '#middleware/requireUser';
import requireBody from '#middleware/requireBody';
import {
  listPosts,
  getPostById,
  createPostWithItems,
  updatePostByOwner,
  deletePostByOwner,
} from '#db/queries/postQueries';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    res.send(await listPosts(req.query));
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const post = await getPostById(Number(req.params.id));
    if (!post) return res.status(404).send('Post not found');
    res.send(post);
  } catch (e) {
    next(e);
  }
});

router.post(
  '/',
  requireUser,
  //add category_id
  requireBody(['title', 'items', 'category_id']),
  async (req, res, next) => {
    try {
      console.log("Request body:", req.body); // ← prints the request body

      //add category_id
      const { title, description = '', items, category_id, } = req.body;
      const post = await createPostWithItems({
        userId: req.user.id,
        title,
        description,
        //add    categoryId: category_id,
        categoryId: category_id,
        items,

      });
      res.status(201).send(post);
    } catch (e) {
      next(e);
    }
  }
);

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
