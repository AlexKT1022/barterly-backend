import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import errorHandler from '#middleware/errorHandler';
import getUserFromToken from '#middleware/getUserFromToken';

import postsRouter from '#api/routes/postsRouter';
import usersRouter from '#api/routes/usersRouter';
import offerRouter from '#api/routes/offerRouter.js';
import categoriesRouter from '#api/routes/categoriesRouter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(morgan('dev'));

app.use(getUserFromToken);

app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);
app.use('/api/offers', offerRouter);  
app.use('/api/categories', categoriesRouter);

app.get('/', (req, res) => {
  return res.send(':)');
});

app.use(errorHandler);

export default app;
