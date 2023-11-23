import { TRPCError } from '@trpc/server';

import { addAuditEvent } from '@backend/components/audit';
import { getPool, sql } from '@backend/db';
import { TRPC } from '@backend/router';

import { isAdmin, setPermissionSchema, userSchema } from '@shared/schema/userPermissions';

async function getAllUsers() {
  return getPool().many(sql.type(userSchema)`
  SELECT
    id AS "userId",
    email AS "userEmail",
    "name" AS "userName",
    "role" AS "userRole",
    ("role" = 'Hanna.Admin') AS "isAdmin",
    permissions
  FROM app.user`);
}

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
    getAll: baseProcedure.query(async () => {
      console.log(getAllUsers());
      return getAllUsers();
    }),

    setPermissions: baseProcedure.input(setPermissionSchema).mutation(async ({ input, ctx }) => {
      return await getPool().transaction(async (tx) => {
        await addAuditEvent(tx, {
          eventType: 'userPermissions.setPermissions',
          eventUser: ctx.user.id,
          eventData: input,
        });
        await Promise.all(
          input.map(({ userId, permissions }) => {
            return tx.query(sql.untyped`
              UPDATE app.user
              SET permissions = ${sql.array(permissions, 'text')}
              WHERE id = ${userId}
              RETURNING id AS "userId", permissions
            `);
          })
        );
      });
    }),
  });
};
