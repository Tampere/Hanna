import 'fastify';

declare module 'fastify' {
  interface PassportUser {
    id: string;
  }
}
