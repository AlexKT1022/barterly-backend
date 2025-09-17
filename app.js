import cors from "cors";
import express from "express";
import morgan from "morgan";

import usersRouter from './api/usersRouter.js';
import postsRouter from './api/postsRouter.js';

import errorHandler from "#middleware/errorHandler";
import getUserFromToken from "#middleware/getUserFromToken";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.use(morgan("dev"));

app.use(getUserFromToken);

app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);

app.use(errorHandler);

export default app;
