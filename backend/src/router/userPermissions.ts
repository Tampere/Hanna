import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { addAuditEvent } from '@backend/components/audit';
import { invalidateUserSession } from '@backend/components/session';
import { searchUsers } from '@backend/components/user';
import { getPool, sql } from '@backend/db';
import { TRPC } from '@backend/router';

import {
  isAdmin,
  setPermissionSchema,
  userSchema,
  userSearchSchema,
} from '@shared/schema/userPermissions';

export const createUserPermissionsRouter = (t: TRPC) => {
  const baseProcedure = t.procedure.use(async (opts) => {
    if (isAdmin(opts.ctx.user.role)) {
      return opts.next();
    } else {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'error.insufficientPermissions',
      });
    }
  });

  return t.router({
    getByName: baseProcedure.input(userSearchSchema.optional()).query(async ({ input }) => {
      const userResultSchema = z.array(userSchema);
      const users = await searchUsers(input?.userName ?? '');
      return userResultSchema.parse(users ?? []);
    }),

    setPermissions: baseProcedure.input(setPermissionSchema).mutation(async ({ input, ctx }) => {
      return await getPool().transaction(async (tx) => {
        await addAuditEvent(tx, {
          eventType: 'userPermissions.setPermissions',
          eventUser: ctx.user.id,
          eventData: input,
        });
        const updatedUsers = (
          await Promise.all(
            input.map(({ userId, permissions }) => {
              return tx.one(sql.type(setPermissionSchema)`
              UPDATE app.user
              SET permissions = ${sql.array(permissions, 'text')}
              WHERE id = ${userId}
              RETURNING id AS "userId", permissions
            `);
            }),
          )
        ).flat();
        await invalidateUserSession(updatedUsers.map((u) => u.userId));
        return updatedUsers;
      });
    }),
  });
};
