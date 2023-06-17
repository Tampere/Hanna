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
    ), report AS (
      SELECT
        project.sap_project_id "projectId",
        wbs.plant "plant",
        wbs.wbs_id "wbsId",
        wbs.short_description "wbsName",
        wbs.reason_for_environmental_investment "reasonForEnvironmentalInvestment",
        network.company_code "companyCode",
        code.text_fi "companyCodeTextFi"
      FROM
        app.sap_wbs wbs
        LEFT JOIN app.sap_project project ON project.sap_project_internal_id = wbs.sap_project_internal_id
        LEFT JOIN app.sap_network network ON network.wbs_internal_id = wbs.wbs_internal_id
        LEFT JOIN app.code code ON code.id = ('Kumppani', network.company_code)::app.code_id
      WHERE project.system_status = 'VAPA'
    )
    SELECT
      report.*,
      total_actuals."totalActuals"
    FROM
      report
      LEFT JOIN total_actuals ON report."wbsId" = total_actuals.wbs_element_id
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

export async function getEnvironmentCodeReportSummary(
  filters: EnvironmentCodeReportQuery['filters']
) {
  return await getPool().one(sql.type(
    z.object({ rowCount: z.number(), totalActualsSum: z.number() })
  )`
    SELECT
      count(*) "rowCount",
      sum("totalActuals") "totalActualsSum"
    FROM (${environmentCodeReportFragment(filters)}) query
  `);
}
