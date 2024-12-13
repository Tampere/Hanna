import { z } from 'zod';

import {
  deleteSavedSearchFilter,
  getAllNonExtUsers,
  getAllUsers,
  getSavedSearchFilters,
  getUser,
  upsertSavedSearchFilters,
} from '@backend/components/user/index.js';
import { TRPC } from '@backend/router/index.js';

import { nonEmptyString } from '@shared/schema/common.js';
import { filterType, userSavedSearchFilterSchema } from '@shared/schema/userSavedSearchFilters.js';

export const createUserRouter = (t: TRPC) =>
  t.router({
    self: t.procedure.query(async ({ ctx }) => {
      return ctx.user;
    }),
    get: t.procedure.input(z.object({ userId: z.string() })).query(async ({ input }) => {
      return getUser(input.userId);
    }),
    getAll: t.procedure.query(async () => {
      return getAllUsers();
    }),
    getAllNonExt: t.procedure.query(async () => {
      return getAllNonExtUsers();
    }),

    getSavedSearchFilters: t.procedure
      .input(z.object({ filterType }))
      .query(async ({ ctx, input }) => {
        return getSavedSearchFilters(ctx.user.id, input.filterType);
      }),

    upsertSavedSearchFilters: t.procedure
      .input(userSavedSearchFilterSchema.extend({ filterId: nonEmptyString.optional() }))
      .mutation(async ({ input, ctx }) => {
        return upsertSavedSearchFilters(
          ctx.user.id,
          input.filterName,
          input.projectSearch,
          input.projectObjectSearch,
          input.worktableSearch,
          input.filterId,
        );
      }),

    deleteSavedSearchFilter: t.procedure
      .input(z.object({ filterId: nonEmptyString }))
      .mutation(async ({ input }) => {
        return deleteSavedSearchFilter(input.filterId);
      }),
  });
