import { inferAsyncReturnType, initTRPC } from '@trpc/server';
import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import superjson from 'superjson';

import { logger } from '@backend/logging';
import { createCodeRouter } from '@backend/router/code';
import { createProjectRouter } from '@backend/router/project';
import { createProjectObjectRouter } from '@backend/router/projectObject';
import { createSapRouter } from '@backend/router/sap';
import { createTaskRouter } from '@backend/router/task';

import { User } from '@shared/schema/user';

import { createSessionRouter } from './session';

export function createContext({ req, res }: CreateFastifyContextOptions) {
  // FIXME: user is serialized as string, but PassportUser is an object, need to
  // check where the type goes wrong
  const user = JSON.parse(req.user as any) as User;
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
  projectObject: createProjectObjectRouter(t),
  code: createCodeRouter(t),
  sap: createSapRouter(t),
  session: createSessionRouter(t),
  task: createTaskRouter(t),
});

export type TRPC = typeof t;
export type AppRouter = typeof appRouter;
