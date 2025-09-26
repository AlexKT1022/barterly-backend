// /api/categoriesRouter.js
import express from 'express';
import { listCategories } from '#db/queries/categoryQueries';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const q = req.query.q?.toString() || undefined;
    const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 100) || 100));
    const offset = Math.max(0, Number(req.query.offset ?? 0) || 0);

    const result = await listCategories({ q, limit, offset });
    res.send(result);
  } catch (e) {
    next(e);
  }
});

export default router;
