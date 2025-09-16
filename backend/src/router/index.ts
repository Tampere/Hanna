import { inferAsyncReturnType, initTRPC } from '@trpc/server';
import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import superjson from 'superjson';

import { logger } from '@backend/logging.js';
import { createCodeRouter } from '@backend/router/code.js';
import { createCompanyRouter } from '@backend/router/company.js';
import { createGeneralNotificationRouter } from '@backend/router/generalNotification.js';
import { createJobRouter } from '@backend/router/job.js';
import { createLockedYearsRouter } from '@backend/router/lockedYears.js';
import { createPlanningRouter } from '@backend/router/planning.js';
import { createProjectRouter } from '@backend/router/project/base.js';
import { createDetailplanProjectRouter } from '@backend/router/project/detailplan.js';
import { createInvestmentProjectRouter } from '@backend/router/project/investment.js';
import { createMaintenanceProjectRouter } from '@backend/router/project/maintenance.js';
import { createProjectObjectRouter } from '@backend/router/projectObject/base.js';
import { createInvestmentProjectObjectRouter } from '@backend/router/projectObject/investment.js';
import { createMaintenanceProjectObjectRouter } from '@backend/router/projectObject/maintenance.js';
import { createSapRouter } from '@backend/router/sap.js';
import { createSapReportRouter } from '@backend/router/sapReport.js';
import { createSessionRouter } from '@backend/router/session.js';
import { createUserRouter } from '@backend/router/user.js';
import { createUserPermissionsRouter } from '@backend/router/userPermissions.js';
import { createWorkTableRouter } from '@backend/router/workTable.js';

import { User } from '@shared/schema/user.js';

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
  maintenanceProject: createMaintenanceProjectRouter(t),
  detailplanProject: createDetailplanProjectRouter(t),
  projectObject: createProjectObjectRouter(t),
  investmentProjectObject: createInvestmentProjectObjectRouter(t),
  maintenanceProjectObject: createMaintenanceProjectObjectRouter(t),
  code: createCodeRouter(t),
  sap: createSapRouter(t),
  sapReport: createSapReportRouter(t),
  session: createSessionRouter(t),
  user: createUserRouter(t),
  userPermissions: createUserPermissionsRouter(t),
  company: createCompanyRouter(t),
  job: createJobRouter(t),
  workTable: createWorkTableRouter(t),
  generalNotification: createGeneralNotificationRouter(t),
  lockedYears: createLockedYearsRouter(t),
  planning: createPlanningRouter(t),
});

export type TRPC = typeof t;
export type AppRouter = typeof appRouter;
