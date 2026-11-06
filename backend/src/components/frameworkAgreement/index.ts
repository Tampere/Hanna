import { TRPCError } from '@trpc/server';
import { DatabaseTransactionConnection } from 'slonik';
import { z } from 'zod';

import { sql } from '@backend/db.js';

/**
 * Checks that the framework agreement can be set for a project object. An agreement is selectable
 * if it is valid (not deleted and not expired), or if it is already set for the project object.
 */
export async function assertFrameworkAgreementSelectable(
  tx: DatabaseTransactionConnection,
  frameworkAgreementId: string,
  projectObjectId?: string | null,
) {
  const result = await tx.maybeOne(sql.type(z.object({ selectable: z.boolean() }))`
    SELECT
      (deleted IS FALSE AND (valid_until IS NULL OR valid_until >= CURRENT_DATE))
      OR EXISTS (
        SELECT 1
        FROM app.project_object_investment
        WHERE project_object_id = ${projectObjectId ?? null}
          AND framework_agreement_id = ${frameworkAgreementId}
      ) AS selectable
    FROM app.framework_agreement
    WHERE id = ${frameworkAgreementId}
  `);

  if (!result?.selectable) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'frameworkAgreement.error.notValid' });
  }
}
