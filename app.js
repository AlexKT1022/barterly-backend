import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import apiRouter from '#api/routes/apiRouter';

import errorHandler from '#middleware/errorHandler';
import getUserFromToken from '#middleware/getUserFromToken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(morgan('dev'));

app.use(getUserFromToken);

app.use('/api', apiRouter);

app.get('/', (req, res) => {
  return res.send(':)');
});

app.use(errorHandler);

export default app;
