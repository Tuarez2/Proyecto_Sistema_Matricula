import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import construirConfiguracionCors from './config/cors.js';
import environment from './config/environment.js';
import errorHandler from './middlewares/errorHandler.js';
import notFound from './middlewares/notFound.js';
import { limiteGeneralApi } from './middlewares/rateLimit.js';
import routes from './routes/index.js';

const app = express();

app.disable('x-powered-by');
if (environment.trustProxy !== false) {
  app.set('trust proxy', environment.trustProxy);
}

app.use(helmet());
app.use(cors(construirConfiguracionCors()));
if (environment.nodeEnv !== 'test') {
  app.use(morgan(environment.nodeEnv === 'production' ? 'combined' : 'dev'));
}
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok'
  });
});

app.use('/api/v1', limiteGeneralApi, routes);

app.use(notFound);
app.use(errorHandler);

export default app;
