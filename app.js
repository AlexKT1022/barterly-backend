import cors from "cors";
import express from "express";
import morgan from "morgan";
import path from 'path';
import { fileURLToPath } from 'url';

import usersRouter from './api/usersRouter.js';
import postsRouter from './api/postsRouter.js';

import errorHandler from "#middleware/errorHandler";
import getUserFromToken from "#middleware/getUserFromToken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));


app.use(getUserFromToken);

app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);

app.use(errorHandler);

export default app;
