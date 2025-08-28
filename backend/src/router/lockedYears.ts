import { TRPCError } from '@trpc/server';

import { addAuditEvent } from '@backend/components/audit.js';
import { getPool, sql } from '@backend/db.js';
import { TRPC } from '@backend/router/index.js';

import { lockedYearsSchema } from '@shared/schema/lockedYears.js';
import { isAdmin } from '@shared/schema/userPermissions.js';

export const createAccessMiddleware = (t: TRPC) => () =>
  t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!isAdmin(ctx.user.role)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'error.insufficientPermissions',
      });
    }
    return next();
  });

export const createLockedYearsRouter = (t: TRPC) => {
  const withAccess = createAccessMiddleware(t);

  return t.router({
    get: t.procedure.query(async () => {
      const result = await getPool().maybeOne(sql.type(lockedYearsSchema)`
        SELECT value
        FROM app.global_settings
        WHERE setting = 'locked_years'
      `);
      return result;
    }),

    setLockedYears: t.procedure
      .use(withAccess())
      .input(lockedYearsSchema)
      .mutation(async ({ input, ctx }) => {
        return await getPool().transaction(async (tx) => {
          await addAuditEvent(tx, {
            eventType: 'global_settings.setLockedYears',
            eventUser: ctx.user.id,
            eventData: input,
          });
          await tx.maybeOne(
            sql.untyped`DELETE FROM app.global_settings WHERE setting = 'locked_years'`,
          );
          if (input.length > 0) {
            return await tx.maybeOne(
              sql.untyped`
                INSERT INTO app.global_settings VALUES (
                'locked_years', ${JSON.stringify(input)}::jsonb
            )
          `,
            );
          }
        });
      }),
  });
};
