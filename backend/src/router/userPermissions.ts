import { TRPCError } from '@trpc/server';

import { logger } from '@backend/logging';
import { TRPC } from '@backend/router';
import { investmentProjectFragment } from '@backend/components/project/search';

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
        {
          userId: '12346',
          userName: 'Test User 2',
          isAdmin: true,
          permissions: ['investmentProject.write', 'detailplanProject.write', 'financials.write'],
        },
        {
          userId: '12347',
          userName: 'Test User 3',
          isAdmin: true,
          permissions: ['detailplanProject.write', 'financials.write'],
        },
        {
          userId: '12348',
          userName: 'Test User 4',
          isAdmin: false,
          permissions: ['investmentProject.write', 'detailplanProject.write'],
        },
        {
          userId: '12349',
          userName: 'Test User 6',
          isAdmin: false,
          permissions: ['investmentProject.write', 'detailplanProject.write', 'financials.write'],
        },
        {
          userId: '12350',
          userName: 'Test User 5',
          isAdmin: false,
          permissions: ['investmentProject.write', 'financials.write'],
        },
      ];
    }),
  });
};
