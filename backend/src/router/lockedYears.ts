import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { addAuditEvent } from '@backend/components/audit.js';
import { getPool, sql } from '@backend/db.js';
import { env } from '@backend/env.js';
import { TRPC } from '@backend/router/index.js';

import { lockedYearDetailSchema, lockedYearSchema } from '@shared/schema/lockedYears.js';
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
    /**
     * Returns effectively locked years as an array of numbers.
     * A year is locked if opened_at is NULL or older than the configured
     * auto-close window (LOCKED_YEARS_OPEN_HOURS, default 24h).
     */
    get: t.procedure.query(async () => {
      const result = await getPool().any(sql.type(z.object({ year: lockedYearSchema }))`
        SELECT year
        FROM app.locked_years
        WHERE opened_at IS NULL
           OR opened_at < NOW() - ${`${env.lockedYearsOpenHours} hours`}::interval
        ORDER BY year
      `);
      return result.map((row) => row.year);
    }),

    /** Returns years that are currently temporarily opened. */
    getOpenYears: t.procedure.query(async () => {
      const result = await getPool().any(sql.type(z.object({ year: lockedYearSchema }))`
        SELECT year
        FROM app.locked_years
        WHERE opened_at IS NOT NULL
          AND opened_at >= NOW() - ${`${env.lockedYearsOpenHours} hours`}::interval
        ORDER BY year
      `);
      return result.map((row) => row.year);
    }),

    /** Returns all locked year rows with full detail. */
    getDetails: t.procedure.use(withAccess()).query(async () => {
      return await getPool().any(sql.type(
        z.object({
          year: lockedYearDetailSchema.shape.year,
          lockedBy: z.string(),
          lockedAt: z.coerce.date(),
          openedAt: z.coerce.date().nullable(),
        }),
      )`
        SELECT
          year,
          locked_by AS "lockedBy",
          locked_at AS "lockedAt",
          opened_at AS "openedAt"
        FROM app.locked_years
        ORDER BY year
      `);
    }),

    lockYear: t.procedure
      .use(withAccess())
      .input(z.object({ year: lockedYearSchema }))
      .mutation(async ({ input, ctx }) => {
        return await getPool().transaction(async (tx) => {
          await addAuditEvent(tx, {
            eventType: 'lockedYears.lock',
            eventUser: ctx.user.id,
            eventData: input,
          });
          await tx.query(sql.untyped`
            INSERT INTO app.locked_years (year, locked_by)
            VALUES (${input.year}, ${ctx.user.name})
            ON CONFLICT (year) DO UPDATE
              SET locked_by = EXCLUDED.locked_by,
                  locked_at = NOW(),
                  opened_at = NULL
          `);

          const { rowCount } = await tx.query(sql.untyped`
            UPDATE app.budget
            SET amount = estimate
            WHERE project_object_id IS NOT NULL
              AND year = ${input.year}
              AND estimate IS NOT NULL
          `);

          await addAuditEvent(tx, {
            eventType: 'lockedYears.confirmEstimates',
            eventUser: ctx.user.id,
            eventData: { year: input.year, rowsUpdated: rowCount },
          });
        });
      }),

    unlockYear: t.procedure
      .use(withAccess())
      .input(z.object({ year: lockedYearSchema }))
      .mutation(async ({ input, ctx }) => {
        return await getPool().transaction(async (tx) => {
          await addAuditEvent(tx, {
            eventType: 'lockedYears.unlock',
            eventUser: ctx.user.id,
            eventData: input,
          });
          await tx.query(sql.untyped`
            DELETE FROM app.locked_years WHERE year = ${input.year}
          `);
        });
      }),

    openYear: t.procedure
      .use(withAccess())
      .input(z.object({ year: lockedYearSchema }))
      .mutation(async ({ input, ctx }) => {
        return await getPool().transaction(async (tx) => {
          await addAuditEvent(tx, {
            eventType: 'lockedYears.open',
            eventUser: ctx.user.id,
            eventData: input,
          });
          await tx.query(sql.untyped`
            UPDATE app.locked_years
            SET opened_at = NOW()
            WHERE year = ${input.year}
          `);
        });
      }),

    closeYear: t.procedure
      .use(withAccess())
      .input(z.object({ year: lockedYearSchema }))
      .mutation(async ({ input, ctx }) => {
        return await getPool().transaction(async (tx) => {
          await addAuditEvent(tx, {
            eventType: 'lockedYears.close',
            eventUser: ctx.user.id,
            eventData: input,
          });
          await tx.query(sql.untyped`
            UPDATE app.locked_years
            SET opened_at = NULL
            WHERE year = ${input.year}
          `);
        });
      }),
  });
};
