import { createHash } from 'crypto';
import stringify from 'fast-json-stable-stringify';
import { sql } from 'slonik';
import { z } from 'zod';

import { transformProjectInfo } from '@backend/components/sap/transform';
import { getClient } from '@backend/components/sap/webservice';
import { getPool } from '@backend/db';
import { logger } from '@backend/logging';

import { SAPProject } from '@shared/schema/sapProject';

async function getCachedSapProject(projectId: string) {
  return null;
}

interface MaybeCacheProjectInfoArgs {
  projectId: string;
  projectInfo: SAPProject;
}

function md5Hash(content: string) {
  const hashFunc = createHash('md5');
  hashFunc.update(content);
  return hashFunc.digest('hex');
}

async function maybeCacheProjectInfo({ projectId, projectInfo }: MaybeCacheProjectInfoArgs) {
  const jsonProjectInfo = stringify(projectInfo);
  const hash = md5Hash(jsonProjectInfo);

  // conditional raw data insertion
  const pool = getPool();

  await pool.query(
    sql.type(z.any())`
      INSERT INTO app.sap_projectinfo_raw (sap_project_id, raw_data, data_hash)
      VALUES (${projectId}, ${jsonProjectInfo}, ${hash})
      ON CONFLICT (sap_project_id, data_hash) DO UPDATE SET last_check = now()
    `
  );

  // return the project info as-is
  return projectInfo;
}

export async function getSapProject(projectId: string) {
  logger.info(`Getting SAP project ${projectId}...`);

  // Hit the local database first to see if we have the project recently cached
  const cachedResult = await getCachedSapProject(projectId);
  if (cachedResult) {
    logger.info(`Found recently cached SAP project ${projectId}...`);
    return getCachedSapProject(projectId);
  } else {
    logger.info(`No recent cache entry for ${projectId}, fetching...`);
    const wsClient = getClient();
    const wsResult = await wsClient.SI_ZPS_WS_GET_PROJECT_INFOAsync({ PROJECT: projectId });
    const projectInfo = transformProjectInfo(wsResult);

    return maybeCacheProjectInfo({ projectId, projectInfo });
  }
}
