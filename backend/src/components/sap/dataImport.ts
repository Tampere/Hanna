import { createHash } from 'crypto';
import stringify from 'fast-json-stable-stringify';
import { DatabaseTransactionConnection } from 'slonik';
import { z } from 'zod';

import { transformActuals, transformProjectInfo } from '@backend/components/sap/transform.js';
import { ActualsService, ProjectInfoService } from '@backend/components/sap/webservice.js';
import { getPool, sql } from '@backend/db.js';
import { env } from '@backend/env.js';
import { logger } from '@backend/logging.js';

import { SAPActual, sapActualsSchema } from '@shared/schema/sapActuals.js';
import { SAPProject, sapProjectSchema } from '@shared/schema/sapProject.js';

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
  sapProjectInternalId: string,
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
      company_code,
      planned_start_date,
      planned_finish_date,
      plant,
      system_status
    )
    VALUES (
      ${project.sapProjectId},
      ${project.sapProjectInternalId},
      ${project.shortDescription ?? null},
      ${project.createdAt ?? null},
      ${project.createdBy},
      ${project.updatedAt ?? null},
      ${project.updatedBy ?? null},
      ${project.projectManagerName ?? null},
      ${project.applicantName ?? null},
      ${project.companyCode},
      ${project.plannedStartDate ?? null},
      ${project.plannedEndDate ?? null},
      ${project.plant ?? null},
      ${project.systemStatus}
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
        consult_company,
        blanket_order_id,
        decision_maker,
        decision_date_text,
        contract_price_in_currency_subunit,
        technically_completed_at,
        reason_for_investment,
        reason_for_environmental_investment,
        hierarchy_level
      )
      VALUES (
        ${wbs.wbsId},
        ${wbs.wbsInternalId},
        ${wbs.sapProjectInternalId},
        ${wbs.shortDescription ?? null},
        ${wbs.createdAt ?? null},
        ${wbs.createdBy},
        ${wbs.updatedAt ?? null},
        ${wbs.updatedBy ?? null},
        ${wbs.applicantName ?? null},
        ${wbs.requestingCostCenter ?? null},
        ${wbs.responsibleCostCenter ?? null},
        ${wbs.projectType ?? null},
        ${wbs.priority ?? null},
        ${wbs.plant ?? null},
        ${wbs.consultCompany ?? null},
        ${wbs.blanketOrderId ?? null},
        ${wbs.decisionMaker ?? null},
        ${wbs.decisionDateText ?? null},
        ${wbs.contractPriceInCurrencySubunit ?? null},
        ${wbs.technicallyCompletedAt ?? null},
        ${wbs.reasonForInvestment ?? null},
        ${wbs.reasonForEnvironmentalInvestment ?? null},
        ${wbs.hierarchyLevel}
     )
  `);
  }
}

async function insertNetworks(conn: DatabaseTransactionConnection, wbsItems: SAPProject['wbs']) {
  for (const wbs of wbsItems) {
    for (const network of wbs.network) {
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
          ${network.networkId},
          ${network.networkName ?? null},
          ${network.wbsInternalId},
          ${network.sapProjectInternalId},
          ${network.createdAt ?? null},
          ${network.createdBy},
          ${network.actualStartDate ?? null},
          ${network.actualFinishDate ?? null},
          ${network.companyCode},
          ${network.plant ?? null},
          ${network.technicalCompletionDate ?? null},
          ${network.profitCenter ?? null}
        )
      `);
    }
  }
}

async function insertActivities(conn: DatabaseTransactionConnection, wbsItems: SAPProject['wbs']) {
  for (const wbs of wbsItems) {
    if (wbs.network) {
      for (const network of wbs.network) {
        for (const activity of network.activities) {
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
              ${activity.profitCenter ?? null},
              ${activity.plant ?? null}
            )
          `);
        }
      }
    }
  }
}

async function maybeCacheProjectInfo({ projectId, projectInfo }: MaybeCacheProjectInfoArgs) {
  const jsonProjectInfo = stringify(projectInfo);
  const hash = md5Hash(jsonProjectInfo);

  await getPool().transaction(async (conn) => {
    await conn.any(sql.untyped`
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

    // Skip the project if it has empty project info
    if (!projectInfo) {
      return null;
    }

    return maybeCacheProjectInfo({ projectId, projectInfo });
  }
}

/**
 * SAP actuals
 */

async function getCachedSapActuals(projectId: string, fromYear: number, toYear: number) {
  const result = await getPool().maybeOne(sql.type(z.object({ actuals: sapActualsSchema }))`
    WITH latestActuals AS (
      SELECT
        jsonb_array_elements(raw_data) as raw_data_object,
        rank() OVER (PARTITION BY sap_project_id, actuals_year ORDER BY last_check DESC) AS "rank"
      FROM app.sap_actuals_raw
      WHERE sap_project_id = ${projectId}
        AND actuals_year BETWEEN ${fromYear} AND ${toYear}
        AND last_check > now() - interval '1 seconds' * ${env.sapWebService.actualsInfoTTLSeconds}
    )
    SELECT jsonb_agg(raw_data_object) AS actuals
    FROM latestActuals
    WHERE rank = 1;
  `);
  return result?.actuals;
}

async function getCachedSapActualsByWbs(projectId: string, wbsId: string) {
  const result = await getPool().maybeOne(sql.type(z.object({ actuals: sapActualsSchema }))`
      WITH latestActuals AS (
      SELECT
        jsonb_array_elements(raw_data) as raw_data_object,
        rank() OVER (PARTITION BY sap_project_id, actuals_year ORDER BY last_check DESC) AS "rank"
      FROM app.sap_actuals_raw
      WHERE sap_project_id = ${projectId}
        AND (raw_data->>0)::jsonb->>'wbsElementId' = ${wbsId}
        AND last_check > now() - interval '1 seconds' * ${env.sapWebService.actualsInfoTTLSeconds}
    )
    SELECT jsonb_agg(raw_data_object) AS actuals
    FROM latestActuals
    WHERE rank = 1;
  `);

  return result?.actuals;
}

function iso8601DateYearRange(fromYear: number, toYear: number) {
  return [`${fromYear}-01-01`, `${toYear}-12-31`];
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
        entry_type,
        document_type,
        trading_partner_id
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
        ${actual.entryType},
        ${
          actual?.documentType ?? null
        }, -- NOTE! Remove nullish coalescing after document type added to production
        ${actual.tradingPartnerId}
        );
    `);
  }
}

async function maybeCacheSapActuals(projectId: string, actuals: SAPActual[]) {
  // Group actuals by fiscal year
  const actualsByYear = actuals.reduce(
    (actualsByYear, item) => ({
      ...actualsByYear,
      [item.fiscalYear]: [...(actualsByYear[item.fiscalYear] ?? []), item],
    }),
    {} as { [year: string]: SAPActual[] },
  );

  await getPool().transaction(async (conn) => {
    await conn.any(sql.untyped`
      DELETE FROM app.sap_actuals_item
      WHERE sap_project_id = ${projectId}
        AND extract (year FROM posting_date) = ANY (${sql.array(
          Object.keys(actualsByYear),
          'int4',
        )})
    `);

    await conn.any(sql.untyped`
      INSERT INTO app.sap_actuals_raw (sap_project_id, actuals_year, raw_data, data_hash)
      SELECT * FROM ${sql.unnest(
        Object.entries(actualsByYear).map(([year, actuals]) => {
          const jsonActuals = stringify(actuals);
          const hash = md5Hash(jsonActuals);
          return [projectId, year, jsonActuals, hash];
        }),
        ['text', 'int4', 'jsonb', 'text'],
      )}
      ON CONFLICT (sap_project_id, actuals_year, data_hash) DO UPDATE SET last_check = now()
    `);

    await insertActuals(conn, actuals);
  });

  return actuals;
}

export async function getAllSapActualsForWbs(sapProjectId: string, wbsId: string) {
  if (!env.enabledFeatures.sapActuals) {
    logger.info('SAP actuals are disabled.');
    return [];
  }
  logger.info(`Getting SAP actuals for project: ${sapProjectId}, WBS: ${wbsId}...`);

  const cachedActuals = await getCachedSapActualsByWbs(sapProjectId, wbsId);

  if (cachedActuals) {
    logger.info(`Found recently cached SAP actuals for project: ${sapProjectId}, WBS: ${wbsId}...`);
  } else {
    logger.info(`No recent cache entry for ${sapProjectId}, WBS ${wbsId} actuals, fetching...`);
    const wsClient = ActualsService.getClient();
    const wsResult = await wsClient.SI_ZPS_WS_GET_ACTUALSAsync({
      I_PSPID: sapProjectId,
      I_POSID: wbsId,
    });
    // JSON response in the first element of the array
    const actuals = transformActuals(wsResult[0]);
    return maybeCacheSapActuals(sapProjectId, actuals);
  }
}

export async function getSapActuals(
  sapProjectId: string,
  fromYear: number,
  toYear = fromYear,
  sapWBSId?: string,
) {
  if (!env.enabledFeatures.sapActuals) {
    logger.info('SAP actuals are disabled.');
    return [];
  }

  logger.info(`Getting SAP actuals for ${sapProjectId}, years ${fromYear}-${toYear}...`);

  const cachedActuals = await getCachedSapActuals(sapProjectId, fromYear, toYear);
  if (cachedActuals) {
    logger.info(
      `Found recently cached SAP actuals for ${sapProjectId}, years ${fromYear}-${toYear}...`,
    );
    return cachedActuals;
  } else {
    logger.info(
      `No recent cache entry for ${sapProjectId}, years ${fromYear}-${toYear} actuals, fetching...`,
    );
    const wsClient = ActualsService.getClient();
    const [startDate, endDate] = iso8601DateYearRange(fromYear, toYear);
    const wsResult = await wsClient.SI_ZPS_WS_GET_ACTUALSAsync({
      I_PSPID: sapProjectId,
      ...(sapWBSId && { I_POSID: sapWBSId }),
      I_BUDAT_BEGDA: startDate,
      I_BUDAT_ENDDA: endDate,
    });
    // JSON response in the first element of the array
    const actuals = transformActuals(wsResult[0]);
    return maybeCacheSapActuals(sapProjectId, actuals);
  }
}

export async function sapProjectExists(projectId: string) {
  const wsClient = ProjectInfoService.getClient();
  const [wsResult] = await wsClient.SI_ZPS_WS_GET_PROJECT_INFOAsync({ PROJECT: projectId });
  const containsErrorItem = wsResult.MESSAGES?.item?.some((item: any) => item.TYPE === 'E');
  return !containsErrorItem;
}

interface ProjectListItem {
  PSPID: string;
}

export async function getCompanyProjectList(companyId: string): Promise<ProjectListItem[]> {
  const wsClient = ProjectInfoService.getClient();
  const [wsResult] = await wsClient.SI_ZPS_WS_GET_PROJECT_INFOAsync({ COMPANY: companyId });
  const containsErrorItem = wsResult.MESSAGES?.item?.some((item: any) => item.TYPE === 'E');
  if (containsErrorItem) {
    throw new Error(`Unable to get company project list from SAP for company id: ${companyId}`);
  }
  return wsResult?.PROJECT_INFO.item;
}
