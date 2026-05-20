import { PrismaClient } from '@prisma/client';
import { singleton } from 'tsyringe';

@singleton()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? [{ emit: 'event', level: 'query' }, 'warn', 'error']
          : ['warn', 'error'],
    });
  }
}
