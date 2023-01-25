import { createHash } from 'crypto';
import stringify from 'fast-json-stable-stringify';
import { DatabaseTransactionConnection } from 'slonik';
import { z } from 'zod';

import { transformActuals, transformProjectInfo } from '@backend/components/sap/transform';
import { ActualsService, ProjectInfoService } from '@backend/components/sap/webservice';
import { getPool, sql } from '@backend/db';
import { env } from '@backend/env';
import { logger } from '@backend/logging';

import { SAPActual, sapActualsSchema } from '@shared/schema/sapActuals';
import { SAPProject, sapProjectSchema } from '@shared/schema/sapProject';

async function getCachedSapProject(projectId: string) {
  const result = await getPool().maybeOne(sql.type(z.object({ projectInfo: sapProjectSchema }))`
    WITH latestProjectInfo AS (
      SELECT
        raw_data,
        rank() OVER (PARTITION BY sap_project_id ORDER BY last_check DESC) AS "rank"
      FROM app.sap_projectinfo_raw
      WHERE sap_project_id = ${projectId}
        AND last_check > now() - interval '1 seconds' * ${env.sapWebService.projectInfoTTLSeconds}
    )
    SELECT latestProjectInfo.raw_data AS "projectInfo"
    FROM latestProjectInfo
    WHERE rank = 1;
  `);
  return result?.projectInfo;
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

async function getSapProjectInternalId(conn: DatabaseTransactionConnection, sapProjectId: string) {
  const result = await conn.maybeOne(sql.untyped`
      SELECT sap_project_internal_id AS "sapProjectInternalId"
      FROM app.sap_project
      WHERE sap_project_id = ${sapProjectId}
  `);

  return result?.sapProjectInternalId;
}

async function deleteProjectStructures(
  conn: DatabaseTransactionConnection,
  sapProjectInternalId: string
) {
  const deletions = [
    sql.untyped`DELETE FROM app.sap_activity WHERE sap_project_internal_id = ${sapProjectInternalId}`,
    sql.untyped`DELETE FROM app.sap_network WHERE sap_project_internal_id = ${sapProjectInternalId}`,
    sql.untyped`DELETE FROM app.sap_wbs WHERE sap_project_internal_id = ${sapProjectInternalId}`,
    sql.untyped`DELETE FROM app.sap_project WHERE sap_project_internal_id = ${sapProjectInternalId}`,
  ];

  await Promise.all(deletions.map((query) => conn.any(query)));
}

async function insertProject(conn: DatabaseTransactionConnection, project: SAPProject) {
  await conn.any(sql.untyped`
    INSERT INTO app.sap_project (
      sap_project_id,
      sap_project_internal_id,
      short_description,
      created_at,
      created_by,
      updated_at,
      updated_by,
      project_manager_name,
      applicant_name,
      planned_start_date,
      planned_finish_date,
      plant
    )
    VALUES (
      ${project.sapProjectId},
      ${project.sapProjectInternalId},
      ${project.shortDescription},
      ${project.createdAt},
      ${project.createdBy},
      ${project.updatedAt ?? null},
      ${project.updatedBy},
      ${project.projectManagerName},
      ${project.applicantName},
      ${project.plannedStartDate ?? null},
      ${project.plannedEndDate ?? null},
      ${project.plant}
    )
  `);
}

async function insertWBS(conn: DatabaseTransactionConnection, wbsItems: SAPProject['wbs']) {
  for (const wbs of wbsItems) {
    await conn.any(sql.untyped`
      INSERT INTO app.sap_wbs (
        wbs_id,
        wbs_internal_id,
        sap_project_internal_id,
        short_description,
        created_at,
        created_by,
        updated_at,
        updated_by,
        applicant_name,
        requesting_cost_center,
        responsible_cost_center,
        project_type,
        priority,
        plant,
        technically_completed_at,
        reason_for_investment,
        reason_for_environmental_investment,
        hierarchy_level
      )
      VALUES (
        ${wbs.wbsId},
        ${wbs.wbsInternalId},
        ${wbs.sapProjectInternalId},
        ${wbs.shortDescription},
        ${wbs.createdAt},
        ${wbs.createdBy},
        ${wbs.updatedAt ?? null},
        ${wbs.updatedBy ?? null},
        ${wbs.applicantName},
        ${wbs.requestingCostCenter ?? null},
        ${wbs.responsibleCostCenter ?? null},
        ${wbs.projectType},
        ${wbs.priority},
        ${wbs.plant},
        ${wbs.technicallyCompletedAt ?? null},
        ${wbs.reasonForInvestment},
        ${wbs.reasonForEnvironmentalInvestment ?? null},
        ${wbs.hierarchyLevel}
     )
  `);
  }
}

async function insertNetworks(conn: DatabaseTransactionConnection, wbsItems: SAPProject['wbs']) {
  for (const wbs of wbsItems) {
    if (wbs.network) {
      await conn.any(sql.untyped`
        INSERT INTO app.sap_network (
          network_id,
          network_name,
          wbs_internal_id,
          sap_project_internal_id,
          created_at,
          created_by,
          actual_start_date,
          actual_finish_date,
          company_code,
          plant,
          technical_completion_date,
          profit_center
        )
        VALUES (
          ${wbs.network.networkId},
          ${wbs.network.networkName},
          ${wbs.network.wbsInternalId},
          ${wbs.network.sapProjectInternalId},
          ${wbs.network.createdAt},
          ${wbs.network.createdBy},
          ${wbs.network.actualStartDate ?? null},
          ${wbs.network.actualFinishDate ?? null},
          ${wbs.network.companyCode},
          ${wbs.network.plant},
          ${wbs.network.technicalCompletionDate ?? null},
          ${wbs.network.profitCenter ?? null}
        )
      `);
    }
  }
}

async function insertActivities(conn: DatabaseTransactionConnection, wbsItems: SAPProject['wbs']) {
  for (const wbs of wbsItems) {
    if (wbs.network) {
      for (const activity of wbs.network.activities) {
        await conn.any(sql.untyped`
          INSERT INTO app.sap_activity (
            routing_number,
            order_counter,
            activity_number,
            network_id,
            short_description,
            sap_project_internal_id,
            wbs_internal_id,
            profit_center,
            plant
          ) VALUES (
            ${activity.routingNumber},
            ${activity.orderCounter},
            ${activity.activityNumber},
            ${activity.networkId},
            ${activity.shortDescription},
            ${activity.sapProjectInternalId},
            ${activity.wbsInternalId},
            ${activity.profitCenter},
            ${activity.plant}
          )
        `);
      }
    }
  }
}

async function maybeCacheProjectInfo({ projectId, projectInfo }: MaybeCacheProjectInfoArgs) {
  const jsonProjectInfo = stringify(projectInfo);
  const hash = md5Hash(jsonProjectInfo);

  await getPool().transaction(async (conn) => {
    conn.any(sql.untyped`
      INSERT INTO app.sap_projectinfo_raw (sap_project_id, raw_data, data_hash)
      VALUES (${projectId}, ${jsonProjectInfo}, ${hash})
      ON CONFLICT (sap_project_id, data_hash) DO UPDATE SET last_check = now()
    `);

    const internalId = await getSapProjectInternalId(conn, projectId);
    if (internalId) {
      await deleteProjectStructures(conn, internalId);
    }

    await insertProject(conn, projectInfo);
    await insertWBS(conn, projectInfo.wbs);
    await insertNetworks(conn, projectInfo.wbs);
    await insertActivities(conn, projectInfo.wbs);
  });

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
    const wsClient = ProjectInfoService.getClient();
    const wsResult = await wsClient.SI_ZPS_WS_GET_PROJECT_INFOAsync({ PROJECT: projectId });
    // JSON response in the first element of the array
    const projectInfo = transformProjectInfo(wsResult[0]);

    return maybeCacheProjectInfo({ projectId, projectInfo });
  }
}

/**
 * SAP actuals
 */

async function getCachedSapActuals(projectId: string, year: string) {
  const result = await getPool().maybeOne(sql.type(z.object({ actuals: sapActualsSchema }))`
    WITH latestActuals AS (
      SELECT
        raw_data,
        rank() OVER (PARTITION BY sap_project_id, actuals_year ORDER BY last_check DESC) AS "rank"
      FROM app.sap_actuals_raw
      WHERE sap_project_id = ${projectId}
        AND actuals_year = ${year}
        AND last_check > now() - interval '1 seconds' * ${env.sapWebService.actualsInfoTTLSeconds}
    )
    SELECT raw_data AS actuals
    FROM latestActuals
    WHERE rank = 1;
  `);
  return result?.actuals;
}

function iso8601DateYearRange(year: string) {
  return [`${year}-01-01`, `${year}-12-31`];
}

async function insertActuals(conn: DatabaseTransactionConnection, actuals: SAPActual[]) {
  for (const actual of actuals) {
    await conn.any(sql.untyped`
      INSERT INTO app.sap_actuals_item (
        document_number,
        description,
        sap_project_id,
        wbs_element_id,
        network_id,
        activity_id,
        fiscal_year,
        document_date,
        posting_date,
        creation_date,
        object_type,
        currency,
        value_in_currency_subunit,
        entry_type
      )
      VALUES (
        ${actual.documentNumber},
        ${actual.description},
        ${actual.sapProjectId},
        ${actual.wbsElementId},
        ${actual.networkId},
        ${actual.activityId},
        ${actual.fiscalYear},
        ${actual.documentDate},
        ${actual.postingDate},
        ${actual.creationDate},
        ${actual.objectType},
        ${actual.currency},
        ${actual.valueInCurrencySubunit},
        ${actual.entryType}
        );
    `);
  }
}

async function maybeCacheSapActuals(projectId: string, year: string, actuals: SAPActual[]) {
  const jsonActuals = stringify(actuals);
  const hash = md5Hash(jsonActuals);

  await getPool().transaction(async (conn) => {
    conn.any(sql.untyped`
      DELETE FROM app.sap_actuals_item
      WHERE sap_project_id = ${projectId}
        AND extract (year FROM posting_date) = ${year}
    `);

    conn.any(sql.untyped`
      INSERT INTO app.sap_actuals_raw (sap_project_id, actuals_year, raw_data, data_hash)
      VALUES (${projectId}, ${year}, ${jsonActuals}, ${hash})
      ON CONFLICT (sap_project_id, actuals_year, data_hash) DO UPDATE SET last_check = now()
    `);

    await insertActuals(conn, actuals);
  });

  return actuals;
}

export async function getSapActuals(projectId: string, year: string) {
  logger.info(`Getting SAP actuals for ${projectId}, year ${year}...`);

  const cachedActuals = await getCachedSapActuals(projectId, year);
  if (cachedActuals) {
    logger.info(`Found recently cached SAP actuals for ${projectId}, year ${year}...`);
    return cachedActuals;
  } else {
    logger.info(`No recent cache entry for ${projectId}, year ${year} actuals, fetching...`);
    const wsClient = ActualsService.getClient();
    const [startDate, endDate] = iso8601DateYearRange(year);
    const wsResult = await wsClient.SI_ZPS_WS_GET_ACTUALSAsync({
      I_PSPID: projectId,
      I_BUDAT_BEGDA: startDate,
      I_BUDAT_ENDDA: endDate,
    });
    // JSON response in the first element of the array
    const actuals = transformActuals(wsResult[0]);
    return maybeCacheSapActuals(projectId, year, actuals);
  }
}
