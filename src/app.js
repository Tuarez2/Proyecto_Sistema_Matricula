import cors from 'cors';
import express from 'express';
import config from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import routes from './routes/index.js';

const app = express();

const corsOptions =
  config.corsOrigin === '*'
    ? { origin: '*' }
    : { origin: config.corsOrigin.split(',').map((origin) => origin.trim()) };

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
