import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import errorHandler from './middleware/errorHandler';
import getUserFromToken from './middleware/getUserFromToken';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.use(morgan('dev'));

app.use(getUserFromToken);

app.get('/', (req, res) => {
  return res.send(':)');
});

app.use(errorHandler);

export default app;
