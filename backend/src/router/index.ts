import { inferAsyncReturnType, initTRPC } from '@trpc/server';
import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import superjson from 'superjson';

import { env } from '@backend/env';
import { logger } from '@backend/logging';
import { createCodeRouter } from '@backend/router/code';
import { createCompanyRouter } from '@backend/router/company';
import { createProjectRouter } from '@backend/router/project/base';
import { createDetailplanProjectRouter } from '@backend/router/project/detailplan';
import { createInvestmentProjectRouter } from '@backend/router/project/investment';
import { createProjectObjectRouter } from '@backend/router/projectObject';
import { createSapRouter } from '@backend/router/sap';
import { createTaskRouter } from '@backend/router/task';
import { createUserPermissionsRouter } from '@backend/router/userPermissions';
import { createWorkTableRouter } from '@backend/router/workTable';

import { User } from '@shared/schema/user';

import { createJobRouter } from './job';
import { createSapReportRouter } from './sapReport';
import { createSessionRouter } from './session';
import { createUserRouter } from './user';

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
  investmentProject: createInvestmentProjectRouter(t),
  detailplanProject: createDetailplanProjectRouter(t),
  projectObject: createProjectObjectRouter(t),
  code: createCodeRouter(t),
  sap: createSapRouter(t),
  sapReport: createSapReportRouter(t),
  session: createSessionRouter(t),
  task: createTaskRouter(t),
  user: createUserRouter(t),
  userPermissions: createUserPermissionsRouter(t),
  company: createCompanyRouter(t),
  job: createJobRouter(t),
  workTable: createWorkTableRouter(t),
});

export type TRPC = typeof t;
export type AppRouter = typeof appRouter;
