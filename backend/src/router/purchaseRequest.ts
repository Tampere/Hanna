import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  deletePurchaseRequest,
  getCostCentersWithPhases,
  getPurchaseRequest,
  getPurchaseRequestDefaults,
  listPurchaseRequests,
  setPurchaseOrderNumber,
  upsertPurchaseRequest,
} from '@backend/components/purchaseRequest/index.js';
import { TRPC } from '@backend/router/index.js';
import { createAccessMiddleware as createProjectObjectAccessMiddleware } from '@backend/router/projectObject/base.js';
import { createFinanceOfficeMiddleware } from '@backend/router/sapIdentifier.js';

import { nonEmptyString } from '@shared/schema/common.js';
import {
  setPurchaseOrderNumberSchema,
  upsertPurchaseRequestSchema,
} from '@shared/schema/purchaseRequest.js';
import { hasWritePermission, isAdmin, ownsProject } from '@shared/schema/userPermissions.js';

export const createPurchaseRequestRouter = (t: TRPC) => {
  const withProjectObjectAccess = createProjectObjectAccessMiddleware(t);
  const financeOfficeOnly = createFinanceOfficeMiddleware(t);

  return t.router({
    list: t.procedure
      .input(z.object({ projectObjectId: nonEmptyString }))
      .query(async ({ input }) => listPurchaseRequests(input.projectObjectId)),

    get: t.procedure
      .input(z.object({ id: nonEmptyString }))
      .query(async ({ input }) => getPurchaseRequest(input.id)),

    getDefaults: t.procedure
      .input(z.object({ projectObjectId: nonEmptyString }))
      .query(async ({ input }) => getPurchaseRequestDefaults(input.projectObjectId)),

    getCostCenters: t.procedure.query(async () => getCostCentersWithPhases()),

    /** Create, or replace and resend. Same access as editing the kohde. */
    upsert: t.procedure
      .input(upsertPurchaseRequestSchema)
      .use(
        withProjectObjectAccess(
          (usr, ctx) => ownsProject(usr, ctx) || hasWritePermission(usr, ctx),
        ),
      )
      .mutation(async ({ input, ctx }) => upsertPurchaseRequest(input, ctx.user)),

    setPurchaseOrderNumber: t.procedure
      .input(setPurchaseOrderNumberSchema)
      .use(financeOfficeOnly)
      .mutation(async ({ input, ctx }) => setPurchaseOrderNumber(input, ctx.user)),

    /** Admin only. */
    delete: t.procedure
      .input(z.object({ id: nonEmptyString }))
      .use(
        t.middleware(async ({ ctx, next }) => {
          if (!isAdmin(ctx.user.role)) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'error.insufficientPermissions' });
          }
          return next();
        }),
      )
      .mutation(async ({ input, ctx }) => deletePurchaseRequest(input.id, ctx.user)),
  });
};
