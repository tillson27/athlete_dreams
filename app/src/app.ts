import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { container } from 'tsyringe';
import { requestIdMiddleware } from './middleware/requestIdMiddleware';
import { errorHandler } from './middleware/errorHandler';
import { HealthRouterFactory } from './api/health/HealthRouterFactory';
import { AuthRouterFactory } from './api/auth/AuthRouterFactory';
import { UserRouterFactory } from './api/users/UserRouterFactory';
import { TeamRouterFactory } from './api/teams/TeamRouterFactory';
import { AthleteRouterFactory } from './api/athletes/AthleteRouterFactory';
import { AthleteStripeRouterFactory } from './api/athleteStripe/AthleteStripeRouterFactory';
import { CampaignRouterFactory } from './api/campaigns/CampaignRouterFactory';
import { AthleteCampaignsRouterFactory } from './api/campaigns/AthleteCampaignsRouterFactory';
import { AthleteFollowRouterFactory } from './api/follows/AthleteFollowRouterFactory';
import { MyFollowsRouterFactory } from './api/follows/MyFollowsRouterFactory';
import { CommunityRouterFactory } from './api/community/CommunityRouterFactory';

function parseAllowedOrigins(): string[] {
  const raw = process.env.CORS_ALLOWED_ORIGINS ?? '';
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function buildApp(): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: parseAllowedOrigins(),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '15mb' }));
  app.use(requestIdMiddleware);

  const routerFactories = [
    container.resolve(HealthRouterFactory),
    container.resolve(AuthRouterFactory),
    container.resolve(UserRouterFactory),
    container.resolve(TeamRouterFactory),
    container.resolve(AthleteStripeRouterFactory),
    container.resolve(AthleteRouterFactory),
    container.resolve(AthleteCampaignsRouterFactory),
    container.resolve(AthleteFollowRouterFactory),
    container.resolve(MyFollowsRouterFactory),
    container.resolve(CampaignRouterFactory),
    container.resolve(CommunityRouterFactory),
  ];
  for (const factory of routerFactories) {
    app.use(factory.basePath, factory.build());
  }

  app.use(errorHandler);
  return app;
}
