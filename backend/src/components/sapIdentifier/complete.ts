import { DatabaseTransactionConnection } from 'slonik';

import { sql } from '@backend/db.js';

import { User } from '@shared/schema/user.js';

/**
 * Completes open SAP identifier requests of a hanke and its kohteet whose identifier is now set.
 * Called after the normal project / project object upserts, so a request is closed also when
 * the identifier is entered through the regular forms instead of the finance page.
 *
 * Kept free of project component imports to avoid an import cycle.
 */
export async function completeFulfilledSapIdentifierRequests(
  tx: DatabaseTransactionConnection,
  projectId: string,
  userId: User['id'],
) {
  await tx.query(sql.untyped`
    UPDATE app.sap_identifier_request r
    SET completed_by = ${userId}, completed_at = now()
    WHERE r.project_id = ${projectId}
      AND r.completed_at IS NULL
      AND (
        (r.project_object_id IS NULL AND EXISTS (
          SELECT 1 FROM app.project p WHERE p.id = r.project_id AND p.sap_project_id IS NOT NULL
        ))
        OR
        (r.project_object_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM app.project_object po
          WHERE po.id = r.project_object_id AND po.sap_wbs_id IS NOT NULL
        ))
      )
  `);
}
