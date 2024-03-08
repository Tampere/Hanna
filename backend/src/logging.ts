import pino from 'pino';

import { env } from './env';

export const logger = pino({
  level: env.logLevel ?? 'debug',
  ...(env.nodeEnv === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  }),
});
