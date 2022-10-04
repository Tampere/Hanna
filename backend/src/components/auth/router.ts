import { createRouter } from '@src/router/createRouter';

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
