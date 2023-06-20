import { z } from 'zod';

import { getPool, sql, textToTsQuery } from '@backend/db';

import { EnvironmentCodeReportQuery, environmentCodeReportSchema } from '@shared/schema/sapReport';

function environmentCodeReportFragment(params?: Partial<EnvironmentCodeReportQuery>) {
  return sql.fragment`
    WITH total_actuals AS (
      SELECT wbs_element_id, sum(value_in_currency_subunit) AS "totalActuals"
      FROM app.sap_actuals_item
      ${
        params?.filters?.year != null
          ? sql.fragment`
        WHERE fiscal_year = ${params.filters.year}
      `
          : sql.fragment``
      }
      GROUP BY wbs_element_id
    ), report AS (
      SELECT
        project.sap_project_id "projectId",
        wbs.plant "plant",
        wbs.wbs_id "wbsId",
        wbs.short_description "wbsName",
        wbs.reason_for_environmental_investment "reasonForEnvironmentalInvestment",
        environment_code.text_fi "reasonForEnvironmentalInvestmentTextFi",
        network.company_code "companyCode",
        company_code.text_fi "companyCodeTextFi"
      FROM
        app.sap_wbs wbs
        LEFT JOIN app.sap_project project ON project.sap_project_internal_id = wbs.sap_project_internal_id
        LEFT JOIN app.sap_network network ON network.wbs_internal_id = wbs.wbs_internal_id
        LEFT JOIN app.code company_code ON company_code.id = ('Kumppani', network.company_code)::app.code_id
        LEFT JOIN app.code environment_code ON environment_code.id = ('YmpäristönsuojelunSyy', wbs.reason_for_environmental_investment)::app.code_id
      WHERE project.system_status = 'VAPA'
    )
    SELECT
      report.*,
      total_actuals."totalActuals"
    FROM
      report
      LEFT JOIN total_actuals ON report."wbsId" = total_actuals.wbs_element_id
    WHERE
      "totalActuals" IS NOT NULL
    AND ${
      params?.filters?.text
        ? sql.fragment`
              ${textToTsQuery(params?.filters?.text)}
              @@ to_tsvector(
                'simple',
                concat_ws(' ', "projectId", "wbsId", "wbsName")
              )`
        : sql.fragment`true`
    }
    AND ${
      params?.filters?.plants && params.filters.plants.length > 0
        ? sql.fragment`plant = ANY(${sql.array(params.filters.plants, 'text')})`
        : sql.fragment`true`
    }
    AND ${
      params?.filters?.reasonsForEnvironmentalInvestment &&
      params.filters.reasonsForEnvironmentalInvestment.length > 0
        ? sql.fragment`"reasonForEnvironmentalInvestment" = ANY(${sql.array(
            params.filters.reasonsForEnvironmentalInvestment,
            'text'
          )})`
        : sql.fragment`true`
    }
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
  filters: Pick<EnvironmentCodeReportQuery, 'filters'>
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
