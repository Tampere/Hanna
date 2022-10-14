import { createRouter } from '@backend/router/createRouter';

export const apiRouter = createRouter().query('ping', {
  resolve() {
    return { ping: 'pong', date: new Date() };
  },
});
