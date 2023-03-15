import { getAllUsers } from '@backend/components/user';
import { TRPC } from '@backend/router';

export const createUserRouter = (t: TRPC) =>
  t.router({
    getAll: t.procedure.query(async () => {
      return await getAllUsers();
    }),
  });
