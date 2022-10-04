import { createTRPCClient } from '@trpc/client';
import { httpLink } from '@trpc/client/links/httpLink';
import superjson from 'superjson';

import type { AppRouter } from '../../backend/src/router';

export const client = createTRPCClient<AppRouter>({
  url: '/trpc',
  // disable batching
  links: [httpLink({ url: '/trpc' })],
  transformer: superjson,
});
