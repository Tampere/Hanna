import 'fastify';

import { User } from '@shared/schema/user';

declare module 'fastify' {
  type PassportUser = User;
}
