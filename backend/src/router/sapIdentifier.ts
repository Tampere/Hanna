import { TRPCError } from '@trpc/server';

import {
  getCostCenters,
  getFinanceView,
  getRequestDefaults,
  getStatus,
  requestProjectObjectSapIdentifier,
  requestProjectSapIdentifier,
  setProjectObjectSapWbsId,
  setProjectSapId,
} from '@backend/components/sapIdentifier/index.js';
import { TRPC } from '@backend/router/index.js';
import { createAccessMiddleware as createProjectAccessMiddleware } from '@backend/router/project/base.js';
import { createAccessMiddleware as createProjectObjectAccessMiddleware } from '@backend/router/projectObject/base.js';

import {
  projectObjectSapIdentifierRequestSchema,
  projectSapIdentifierRequestSchema,
  sapIdentifierTargetSchema,
  setSapIdentifierSchema,
} from '@shared/schema/sapIdentifierRequest.js';
import {
  canSetFinanceIdentifiers,
  hasWritePermission,
  ownsProject,
} from '@shared/schema/userPermissions.js';

/** Finance office (or admin) only. */
export const createFinanceOfficeMiddleware = (t: TRPC) =>
  t.middleware(async ({ ctx, next }) => {
    if (!canSetFinanceIdentifiers(ctx.user)) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'error.insufficientPermissions' });
    }
    return next();
  });

export const createSapIdentifierRouter = (t: TRPC) => {
  const withProjectAccess = createProjectAccessMiddleware(t);
  const withProjectObjectAccess = createProjectObjectAccessMiddleware(t);
  const financeOfficeOnly = createFinanceOfficeMiddleware(t);

  return t.router({
    getStatus: t.procedure.input(sapIdentifierTargetSchema).query(async ({ input }) => {
      return getStatus(input);
    }),

    getRequestDefaults: t.procedure.input(sapIdentifierTargetSchema).query(async ({ input }) => {
      return getRequestDefaults(input);
    }),

    getCostCenters: t.procedure.query(async () => {
      return getCostCenters();
    }),

    requestForProject: t.procedure
      .input(projectSapIdentifierRequestSchema)
      .use(withProjectAccess((usr, ctx) => ownsProject(usr, ctx) || hasWritePermission(usr, ctx)))
      .mutation(async ({ input, ctx }) => {
        return requestProjectSapIdentifier(input, ctx.user);
      }),

    requestForProjectObject: t.procedure
      .input(projectObjectSapIdentifierRequestSchema)
      .use(
        withProjectObjectAccess(
          (usr, ctx) => ownsProject(usr, ctx) || hasWritePermission(usr, ctx),
        ),
      )
      .mutation(async ({ input, ctx }) => {
        return requestProjectObjectSapIdentifier(input, ctx.user);
      }),

    getFinanceView: t.procedure
      .input(sapIdentifierTargetSchema)
      .use(financeOfficeOnly)
      .query(async ({ input }) => {
        return getFinanceView(input);
      }),

    setIdentifier: t.procedure
      .input(setSapIdentifierSchema)
      .use(financeOfficeOnly)
      .mutation(async ({ input, ctx }) => {
        const { projectId, projectObjectId, identifier } = input;
        return projectObjectId
          ? setProjectObjectSapWbsId({ projectId, projectObjectId }, identifier, ctx.user)
          : setProjectSapId({ projectId }, identifier, ctx.user);
      }),
  });
};
