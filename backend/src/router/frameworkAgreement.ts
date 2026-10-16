import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { addAuditEvent } from '@backend/components/audit.js';
import { getPool, sql } from '@backend/db.js';
import { TRPC } from '@backend/router/index.js';

import {
  frameworkAgreementIdSchema,
  frameworkAgreementSchema,
  upsertFrameworkAgreementSchema,
} from '@shared/schema/frameworkAgreement.js';
import { isAdmin } from '@shared/schema/userPermissions.js';

const selectFrameworkAgreementFragment = sql.fragment`
  SELECT
    id,
    record_number AS "recordNumber",
    name,
    record_id AS "recordId",
    valid_until AS "validUntil",
    (deleted IS FALSE AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)) AS "isValid"
  FROM app.framework_agreement
`;

const createAccessMiddleware = (t: TRPC) => () =>
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

export const createFrameworkAgreementRouter = (t: TRPC) => {
  const withAccess = createAccessMiddleware(t);

  return t.router({
    /**
     * Returns all non-deleted framework agreements. If includeId is given, that agreement is
     * returned as well even if it has been deleted (used for showing the current selection).
     */
    getAll: t.procedure
      .input(z.object({ includeId: z.string().nullish() }).optional())
      .query(async ({ input }) => {
        return getPool().any(sql.type(frameworkAgreementSchema)`
          ${selectFrameworkAgreementFragment}
          WHERE deleted IS FALSE ${
            input?.includeId ? sql.fragment`OR id = ${input.includeId}` : sql.fragment``
          }
          ORDER BY record_number, name
        `);
      }),

    getById: t.procedure.input(frameworkAgreementIdSchema).query(async ({ input }) => {
      return getPool().one(sql.type(frameworkAgreementSchema)`
        ${selectFrameworkAgreementFragment}
        WHERE id = ${input.id} AND deleted IS FALSE
      `);
    }),

    upsert: t.procedure
      .use(withAccess())
      .input(upsertFrameworkAgreementSchema)
      .mutation(async ({ ctx, input }) => {
        await getPool().transaction(async (tx) => {
          await addAuditEvent(tx, {
            eventType: 'frameworkAgreement.upsert',
            eventData: input,
            eventUser: ctx.user.id,
          });
          if (input.id) {
            await tx.query(sql.untyped`
              UPDATE app.framework_agreement
              SET
                record_number = ${input.recordNumber},
                name = ${input.name},
                record_id = ${input.recordId},
                valid_until = ${input.validUntil ?? null},
                modified_by = ${ctx.user.id},
                modified_at = NOW()
              WHERE id = ${input.id}
                AND deleted IS FALSE
            `);
          } else {
            await tx.query(sql.untyped`
              INSERT INTO app.framework_agreement (
                record_number,
                name,
                record_id,
                valid_until,
                modified_by
              )
              VALUES (
                ${input.recordNumber},
                ${input.name},
                ${input.recordId},
                ${input.validUntil ?? null},
                ${ctx.user.id}
              )
            `);
          }
        });
      }),

    delete: t.procedure
      .use(withAccess())
      .input(frameworkAgreementIdSchema)
      .mutation(async ({ ctx, input }) => {
        await getPool().transaction(async (tx) => {
          await addAuditEvent(tx, {
            eventType: 'frameworkAgreement.delete',
            eventData: input,
            eventUser: ctx.user.id,
          });
          await tx.query(sql.untyped`
            UPDATE app.framework_agreement
            SET deleted = TRUE, modified_by = ${ctx.user.id}, modified_at = NOW()
            WHERE id = ${input.id}
          `);
        });
      }),
  });
};
