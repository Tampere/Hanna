import { authRouter } from '@src/components/auth/router';
import { createRouter } from '@src/router/createRouter';
import { apiRouter } from '@src/router/routers/api';

export const appRouter = createRouter().merge(apiRouter).merge(authRouter);

export type AppRouter = typeof appRouter;
