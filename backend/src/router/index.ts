import { initTRPC } from '@trpc/server';
import { inferAsyncReturnType } from '@trpc/server';
import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import superjson from 'superjson';

import { logger } from '@backend/logging';
import { createProjectRouter } from '@backend/router/project';

interface User {
  userId: string | string[] | undefined;
}

export function createContext({ req, res }: CreateFastifyContextOptions) {
  const user: User = { userId: req.headers['username'] };
  return { req, res, user };
}

type Context = inferAsyncReturnType<typeof createContext>;

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const appRouter = t.router({
  ping: t.procedure.query(({ ctx }) => {
    const { req, res, user } = ctx;
    logger.debug({ req, res, user });
    return { pong: true, now: new Date() };
  }),
  project: createProjectRouter(t),
});

export type AppRouter = typeof appRouter;
