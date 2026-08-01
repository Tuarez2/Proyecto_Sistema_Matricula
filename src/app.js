import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import environment from './config/environment.js';
import errorHandler from './middlewares/errorHandler.js';
import notFound from './middlewares/notFound.js';
import routes from './routes/index.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: environment.cors.origin }));
app.use(morgan(environment.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok'
  });
});

app.use('/api/v1', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
