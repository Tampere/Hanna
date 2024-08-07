import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  deleteGeneralNotification,
  getAllGeneralNotifications,
  getGeneralNotification,
  getGeneralNotificationSearchCount,
  getRecentGeneralNotificationCount,
  searchGeneralNotifications,
  upsertGeneralNotification,
} from '@backend/components/generalNotification/index.js';
import { TRPC } from '@backend/router/index.js';

import { upsertGeneralNotificationSchema } from '@shared/schema/generalNotification.js';
import { isAdmin } from '@shared/schema/userPermissions.js';

export const createAccessMiddleware = (t: TRPC) => () =>
  t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!isAdmin(ctx.user.role)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'error.insufficientPermissions',
      });
    }
    return next();
  });

export const createGeneralNotificationRouter = (t: TRPC) => {
  const withAccess = createAccessMiddleware(t);
  return t.router({
    get: t.procedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
      return getGeneralNotification(input.id);
    }),
    delete: t.procedure
      .use(withAccess())
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        return deleteGeneralNotification(input.id, ctx.user.id);
      }),
    upsert: t.procedure
      .use(withAccess())
      .input(upsertGeneralNotificationSchema)
      .mutation(async ({ input, ctx }) => {
        return upsertGeneralNotification(input, ctx.user.id);
      }),
    search: t.procedure.input(z.any()).query(async () => {
      // TODO input should be typed if search filters are implemented
      return searchGeneralNotifications();
    }),
    getSearchCount: t.procedure.input(z.any()).query(async () => {
      // TODO input should be typed if search filters are implemented
      return getGeneralNotificationSearchCount();
    }),
    getAll: t.procedure.query(async () => {
      return getAllGeneralNotifications();
    }),
    getRecentGeneralNotificationCount: t.procedure.query(async () => {
      return getRecentGeneralNotificationCount();
    }),
  });
};
