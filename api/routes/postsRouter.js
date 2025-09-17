import express from 'express';

import { getPostById, getPosts } from '#api/controllers/postController';

const router = express.Router();

router.get('/', getPosts);

router.get('/:id', getPostById);

export default router;
