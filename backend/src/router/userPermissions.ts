import { TRPCError } from '@trpc/server';

import { logger } from '@backend/logging';
import { TRPC } from '@backend/router';

export const createUserPermissionsRouter = (t: TRPC) => {
  const baseProcedure = t.procedure.use(async (opts) => {
    if (opts.ctx.user.roles?.includes('Hanna.Admin')) {
      return opts.next();
    } else {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Forbidden',
      });
    }
  });

  return t.router({
    getAll: baseProcedure.query(async () => {
      logger.warn('Not implemented yet! userPermissions.getAll');
      return [
        {
          userId: '12345',
          userName: 'Test User',
          isAdmin: false,
          permissions: ['investmentProject.write', 'detailplanProject.write', 'financials.write'],
        },
      ];
    }),
  });
};
