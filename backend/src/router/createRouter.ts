import { router } from '@trpc/server';
import superjson from 'superjson';

import { Context } from '@src/router/context';

export function createRouter() {
  return router<Context>().transformer(superjson);
}
