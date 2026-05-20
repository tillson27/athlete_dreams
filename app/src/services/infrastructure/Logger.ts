import pino from 'pino';
import { singleton } from 'tsyringe';

@singleton()
export class Logger {
  readonly pino = pino({
    level: process.env.LOG_LEVEL ?? 'info',
    transport:
      process.env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
        : undefined,
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.passwordHash', '*.accessToken'],
      remove: true,
    },
  });

  info(...args: Parameters<typeof this.pino.info>): void {
    this.pino.info(...args);
  }
  warn(...args: Parameters<typeof this.pino.warn>): void {
    this.pino.warn(...args);
  }
  error(...args: Parameters<typeof this.pino.error>): void {
    this.pino.error(...args);
  }
  debug(...args: Parameters<typeof this.pino.debug>): void {
    this.pino.debug(...args);
  }
}
