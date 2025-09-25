// /api/offerRouter.js
import express from 'express';
import requireUser from '#middleware/requireUser';
import requireBody from '#middleware/requireBody';

import {
  listOffers,
  getOfferById,
  createOffer,        // << renamed: no items
  updateMyOffer,      // now only edits message and/or child_post_id
  acceptOffer,
  rejectOffer,
} from '#db/queries/offerQueries';

const router = express.Router();

// Temporary request tracer; remove later if we want
router.use((req, _res, next) => {
  console.log('OFFERS:', req.method, req.originalUrl);
  next();
});

/* -------------------- Public listing & read -------------------- */

// GET /api/offers?post_id=&user_id=&status=&child_post_id=&limit=&offset=
router.get('/', async (req, res, next) => {
  try {
    const { post_id, user_id, status, child_post_id } = req.query;
    const limit  = Math.min(100, Math.max(1, Number(req.query.limit ?? 20) || 20));
    const offset = Math.max(0, Number(req.query.offset ?? 0) || 0);

    const result = await listOffers({
      post_id,
      user_id,
      status,
      child_post_id,
      limit,
      offset,
    });
    res.send(result);
  } catch (e) {
    next(e);
  }
});

// GET /api/offers/:id
router.get('/:id', async (req, res, next) => {
  try {
    const offer = await getOfferById(Number(req.params.id));
    if (!offer) return res.status(404).send('Offer not found');
    res.send(offer);
  } catch (e) {
    next(e);
  }
});

/* -------------------- Create & edit (auth required) -------------------- */

router.get('/_ping', (req, res) => res.send({ ok: true, where: 'offers' }));

// POST /api/offers  { post_id, message?, child_post_id? }
router.post(
  '/',
  requireUser,
  requireBody(['post_id']),
  async (req, res, next) => {
    try {
      const { post_id, message, child_post_id } = req.body;
      const offer = await createOffer({
        post_id,
        user_id: req.user.id,
        message,
        child_post_id, // optional
      });
      res.status(201).send(offer);
    } catch (e) { next(e); }
  }
);

// PATCH /api/offers/:id  { message?, child_post_id? }  (creator only; pending only)
router.patch('/:id', requireUser, async (req, res, next) => {
  try {
    const offer = await updateMyOffer({
      offer_id: Number(req.params.id),
      user_id: req.user.id,
      message: req.body.message,
      child_post_id: req.body.child_post_id,
    });
    res.send(offer);
  } catch (e) {
    next(e);
  }
});

/* -------------------- Moderation by post owner -------------------- */

// POST /api/offers/:id/accept
router.post('/:id/accept', requireUser, async (req, res, next) => {
  try {
    const trade = await acceptOffer({
      offer_id: Number(req.params.id),
      acting_user_id: req.user.id,
    });
    res.send({ ok: true, trade });
  } catch (e) {
    next(e);
  }
});

// POST /api/offers/:id/reject
router.post('/:id/reject', requireUser, async (req, res, next) => {
  try {
    const updated = await rejectOffer({
      offer_id: Number(req.params.id),
      acting_user_id: req.user.id,
    });
    res.send(updated);
  } catch (e) {
    next(e);
  }
});

export default router;
