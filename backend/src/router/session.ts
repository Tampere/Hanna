import { TRPC } from '@backend/router';

export const createSessionRouter = (t: TRPC) =>
  t.router({
    // Session check procedure - returns OK when the session check in pre-validation is passed
    check: t.procedure.query(async () => {
      return { sessionOk: true };
    }),
  });
