import { inferAsyncReturnType } from '@trpc/server';
import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';

export interface User {
  userId: string | string[] | undefined;
}

export function createContext({ req, res }: CreateFastifyContextOptions) {
  const user: User = { userId: req.headers['username'] };
  return { req, res, user };
}

export type Context = inferAsyncReturnType<typeof createContext>;
