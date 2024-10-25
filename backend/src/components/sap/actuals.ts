import { z } from 'zod';

import { getPool, sql } from '@backend/db.js';

import { getSapActuals } from './dataImport.js';
import { yearRange } from './utils.js';

export async function refreshProjectSapActuals(
  years: { start: number; end: number },
  projectId: string,
) {
  const currentYear = new Date().getFullYear();
  const endYear = Math.min(years.end, currentYear);

  const result = await getProjectSapIds(projectId);

  if (!result?.sapProjectId) {
    return null;
  }

  await Promise.all(
    yearRange(years.start, endYear).map((year) => getSapActuals(result.sapProjectId, year)),
  );
  return { sapProjectId: result.sapProjectId, endYear };
}

export async function refreshProjectObjectSapActuals(
  years: { start: number; end: number },
  projectObjectId: string,
) {
  const currentYear = new Date().getFullYear();
  const endYear = Math.min(years.end, currentYear);

  const result = await getProjectObjectSapIds(projectObjectId);

  if (!result?.sapWBSId) {
    return null;
  }

  await Promise.all(
    yearRange(years.start, endYear).map((year) =>
      getSapActuals(result.sapProjectId, year, year, result.sapWBSId),
    ),
  );
  return { wbsId: result.sapWBSId, endYear };
}

async function getProjectObjectSapIds(projectObjectId: string) {
  const resultSchema = z.object({ sapWBSId: z.string(), sapProjectId: z.string() });

  return getPool().maybeOne(sql.type(resultSchema)`
    SELECT
      sap_project_id AS "sapProjectId",
      sap_wbs_id AS "sapWBSId"
    FROM app.project_object
    INNER JOIN app.project ON project_object.project_id = project.id
    WHERE project_object.id = ${projectObjectId}
  `);
}

async function getProjectSapIds(projectId: string) {
  return getPool().maybeOne(sql.type(z.object({ sapProjectId: z.string() }))`
  SELECT sap_project_id AS "sapProjectId"
  FROM app.project
  WHERE id = ${projectId}
`);
}
