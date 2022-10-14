import { createRouter } from '@backend/router/createRouter';

export const authRouter = createRouter()
  .query('exampleGet', {
    resolve() {
      return {};
    },
  })
  .mutation('exampleMutation', {
    resolve() {
      return {};
    },
  });
