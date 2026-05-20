import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { container } from 'tsyringe';
import { Logger } from './services/infrastructure/Logger';
import { requestIdMiddleware } from './middleware/requestIdMiddleware';
import { errorHandler } from './middleware/errorHandler';
import { AuthRouterFactory } from './api/auth/AuthRouterFactory';
import { UserRouterFactory } from './api/users/UserRouterFactory';
import { TeamRouterFactory } from './api/teams/TeamRouterFactory';
import { AthleteRouterFactory } from './api/athletes/AthleteRouterFactory';
import { CampaignRouterFactory } from './api/campaigns/CampaignRouterFactory';

function parseAllowedOrigins(): string[] {
  const raw = process.env.CORS_ALLOWED_ORIGINS ?? '';
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function buildApp(): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: parseAllowedOrigins(),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(requestIdMiddleware);

  app.get('/v1/health', (_req, res) => {
    res.json({ data: { status: 'ok' } });
  });

  const routerFactories = [
    container.resolve(AuthRouterFactory),
    container.resolve(UserRouterFactory),
    container.resolve(TeamRouterFactory),
    container.resolve(AthleteRouterFactory),
    container.resolve(CampaignRouterFactory),
  ];
  for (const factory of routerFactories) {
    app.use(factory.basePath, factory.build());
  }

  app.use(errorHandler);
  return app;
}

function start(): void {
  const logger = container.resolve(Logger);
  const port = Number(process.env.PORT ?? 4000);
  const app = buildApp();
  app.listen(port, () => {
    logger.info({ port }, 'FAD API listening');
  });
}

start();
