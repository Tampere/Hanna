import { z } from 'zod';

import { getAllNonExtUsers, getAllUsers, getUser } from '@backend/components/user/index.js';
import { TRPC } from '@backend/router/index.js';

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
  });
