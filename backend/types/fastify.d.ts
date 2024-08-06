import 'fastify';

import { User } from '@shared/schema/user.js';

declare module 'fastify' {
  type PassportUser = User;

  interface Session {
    redirectUrl: string;
  }
}
