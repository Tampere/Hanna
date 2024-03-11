import { getAllNonExtUsers, getAllUsers } from '@backend/components/user';
import { TRPC } from '@backend/router';

export const createUserRouter = (t: TRPC) =>
  t.router({
    self: t.procedure.query(async ({ ctx }) => {
      return ctx.user;
    }),
    getAll: t.procedure.query(async () => {
      return await getAllUsers();
    }),
    getAllNonExt: t.procedure.query(async () => {
      return await getAllNonExtUsers();
    }),
  });
