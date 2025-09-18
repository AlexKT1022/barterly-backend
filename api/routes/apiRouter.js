import express from 'express';

import postsRouter from '#api/routes/postsRouter';
import usersRouter from '#api/routes/usersRouter';

const router = express.Router();

router.use('/posts', postsRouter);
router.use('/users', usersRouter);

export default router;
