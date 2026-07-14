import { PrismaClient } from '@prisma/client';
import { singleton } from 'tsyringe';

@singleton()
export class PrismaService extends PrismaClient {
  constructor() {
    const databaseUrl = process.env.DATABASE_URL ?? buildDatabaseUrlFromComponents();
    super({
      datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
      log:
        process.env.NODE_ENV === 'development'
          ? [{ emit: 'event', level: 'query' }, 'warn', 'error']
          : ['warn', 'error'],
    });
  }
}

function buildDatabaseUrlFromComponents(): string | undefined {
  const databaseHost = process.env.DB_HOST;
  const databaseName = process.env.DB_NAME;
  const databaseUsername = process.env.DB_USERNAME;
  const databasePassword = process.env.DB_PASSWORD;
  if (!databaseHost || !databaseName || !databaseUsername || !databasePassword) return undefined;

  const databasePort = process.env.DB_PORT ?? '5432';
  const sslMode = process.env.DB_SSLMODE ?? 'require';
  const encodedUsername = encodeURIComponent(databaseUsername);
  const encodedPassword = encodeURIComponent(databasePassword);
  const encodedDatabaseName = encodeURIComponent(databaseName);
  return `postgresql://${encodedUsername}:${encodedPassword}@${databaseHost}:${databasePort}/${encodedDatabaseName}?schema=public&sslmode=${sslMode}`;
}
