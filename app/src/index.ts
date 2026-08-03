import 'reflect-metadata';
import 'dotenv/config';
import type { Server } from 'node:http';
import { container } from 'tsyringe';
import { buildApp } from './app';
import { Logger } from './services/infrastructure/Logger';
import { PrismaService } from './services/infrastructure/PrismaService';
import { PostHogService } from './services/infrastructure/PostHogService';

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function start(): Promise<void> {
  const logger = container.resolve(Logger);
  const prismaService = container.resolve(PrismaService);
  const posthogService = container.resolve(PostHogService);
  const port = Number(process.env.PORT ?? 4000);

  await prismaService.$connect();

  const app = buildApp();
  const server = app.listen(port, () => {
    logger.info({ port }, 'FAD API listening');
  });

  registerShutdownHandlers(server, prismaService, posthogService, logger);
}

function registerShutdownHandlers(
  server: Server,
  prismaService: PrismaService,
  posthogService: PostHogService,
  logger: Logger
): void {
  let shuttingDown = false;

  const shutdown = (signal: NodeJS.Signals): void => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    logger.info({ signal }, 'Shutting down FAD API');

    const forceExit = setTimeout(() => {
      logger.error({ signal, timeoutMs: SHUTDOWN_TIMEOUT_MS }, 'Forced shutdown after drain timeout');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();

    server.close((closeError) => {
      void (async () => {
        try {
          await posthogService.shutdown();
        } catch (phError) {
          logger.error({ err: phError }, 'Error shutting down PostHog during shutdown');
        }
        try {
          await prismaService.$disconnect();
        } catch (disconnectError) {
          logger.error({ err: disconnectError }, 'Error disconnecting Prisma during shutdown');
        }
        clearTimeout(forceExit);
        if (closeError) {
          logger.error({ err: closeError }, 'Error closing HTTP server during shutdown');
          process.exit(1);
        }
        process.exit(0);
      })();
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((err) => {
  const logger = container.resolve(Logger);
  logger.error({ err }, 'Failed to start FAD API');
  process.exit(1);
});
