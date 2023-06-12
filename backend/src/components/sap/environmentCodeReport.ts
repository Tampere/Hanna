import { z } from 'zod';

import { getPool, sql } from '@backend/db';

import { EnvironmentCodeReportQuery, environmentCodeReportSchema } from '@shared/schema/sapReport';

function environmentCodeReportFragment(params?: Partial<EnvironmentCodeReportQuery>) {
  // TODO use filters
  return sql.fragment`
    WITH total_actuals AS (
      SELECT wbs_element_id, sum(value_in_currency_subunit) AS "totalActuals"
      FROM app.sap_actuals_item
      GROUP BY wbs_element_id
    ), wbs_elements AS (
      SELECT
        project.sap_project_id "projectId",
        wbs.plant "plant",
        wbs.wbs_id "wbsId",
        wbs.short_description "wbsName",
        wbs.reason_for_environmental_investment "reasonForEnvironmentalInvestment",
        network.company_code "companyCode"
      FROM
        app.sap_wbs wbs
      LEFT JOIN app.sap_project project ON project.sap_project_internal_id = wbs.sap_project_internal_id
      LEFT JOIN app.sap_network network ON network.wbs_internal_id = wbs.wbs_internal_id
    )
    SELECT
      wbs_elements.*,
      total_actuals."totalActuals"
    FROM
      wbs_elements
      LEFT JOIN total_actuals ON wbs_elements."wbsId" = total_actuals.wbs_element_id
    ${
      params?.sort
        ? sql.fragment`ORDER BY ${sql.identifier([params.sort.key])} ${
            params.sort.direction === 'desc' ? sql.fragment`DESC` : sql.fragment`ASC`
          } NULLS LAST`
        : sql.fragment``
    }
  `;
}

export async function getEnvironmentCodeReport(query: EnvironmentCodeReportQuery) {
  return getPool().any(sql.type(environmentCodeReportSchema)`
    ${environmentCodeReportFragment(query)}
    LIMIT ${query.limit}
    OFFSET ${query.offset}
  `);
}

export async function getEnvironmentCodeReportRowCount(
  filters: EnvironmentCodeReportQuery['filters']
) {
  const { count } = await getPool().one(sql.type(z.object({ count: z.number() }))`
    SELECT count(*) AS count
    FROM (${environmentCodeReportFragment(filters)}) query
  `);
  return count;
}
