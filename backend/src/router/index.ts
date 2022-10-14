import { authRouter } from '@backend/components/auth/router';
import { createRouter } from '@backend/router/createRouter';
import { apiRouter } from '@backend/router/routers/api';

export const appRouter = createRouter().merge(apiRouter).merge(authRouter);

export type AppRouter = typeof appRouter;
