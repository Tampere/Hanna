import { inferAsyncReturnType, initTRPC } from '@trpc/server';
import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import superjson from 'superjson';

import { logger } from '@backend/logging';
import { createCodeRouter } from '@backend/router/code';
import { createProjectRouter } from '@backend/router/project';

export interface User {
  userId: string | string[] | undefined;
}

export function createContext({ req, res }: CreateFastifyContextOptions) {
  const user: User = { userId: req.headers['username'] };
  return { req, res, user };
}

type Context = inferAsyncReturnType<typeof createContext>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ error, shape }) {
    // Also log the error stack on the server side
    logger.error(error.stack);
    return shape;
  },
});

export const appRouter = t.router({
  project: createProjectRouter(t),
  code: createCodeRouter(t),
});

export type TRPC = typeof t;
export type AppRouter = typeof appRouter;
