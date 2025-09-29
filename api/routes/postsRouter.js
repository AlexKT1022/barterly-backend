// /api/postsRouter.js
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

import { listOffers } from '#db/queries/offerQueries';

const router = express.Router();

/**
 * GET /api/posts
 * Pass-through to listPosts with query params (q, status, author_id, category_id, limit, offset, etc.)
 */
router.get('/', async (req, res, next) => {
  try {
    res.send(await listPosts(req.query));
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/posts/:id
 * Returns the post plus two arrays I think this should fix our response summary issue:
 *  - responses_summary: offers made TO this post (post_id=:id)
 *  - linked_offers: offers that USE this post as the child/trade item (child_post_id=:id)
 */
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const post = await getPostById(id);
    if (!post) return res.status(404).send('Post not found');

    // fetch both directions of offers for this post
    const [toThisPost, usingThisPost] = await Promise.all([
      listOffers({ post_id: id, limit: 100, offset: 0 }),
      listOffers({ child_post_id: id, limit: 100, offset: 0 }),
    ]);

    // shape a compact summary for each group
    const responses_summary = (toThisPost.offers || []).map((r) => ({
      id: r.id,
      status: r.status,
      message: r.message,
      created_at: r.created_at,
      from: r.author?.username,
      // when someone offered a child post, include a little context
      child_post: r.child_post
        ? { id: r.child_post.id, title: r.child_post.title }
        : null,
    }));

    const linked_offers = (usingThisPost.offers || []).map((r) => ({
      id: r.id,
      status: r.status,
      message: r.message,
      created_at: r.created_at,
      from: r.author?.username,
      // this is the parent they offered *on*
      parent_post: r.post
        ? { id: r.post.id, title: r.post.title }
        : null,
    }));

    res.send({
      ...post,
      responses_summary,
      linked_offers,
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/posts
 * Body: { title, description?, items: [...], category_id }
 */
router.post(
  '/',
  requireUser,
  requireBody(['title', 'items', 'category_id']),
  async (req, res, next) => {
    try {
      const {
        title,
        description = '',
        items,
        category_id,
      } = req.body;

      const post = await createPostWithItems({
        userId: req.user.id,
        title,
        description,
        categoryId: Number(category_id),
        items,
      });

      res.status(201).send(post);
    } catch (e) {
      next(e);
    }
  }
);

/**
 * PATCH /api/posts/:id
 * Only the owner can update; fields are passed through to query layer
 */
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

/**
 * DELETE /api/posts/:id
 * Only the owner can delete
 */
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
