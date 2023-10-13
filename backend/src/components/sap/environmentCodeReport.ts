import { z } from 'zod';

import { getPool, sql, textToTsQuery } from '@backend/db';

import { EXPLICIT_EMPTY } from '@shared/schema/code';
import { EnvironmentCodeReportQuery, environmentCodeReportSchema } from '@shared/schema/sapReport';

function filterPlantFragment(plants?: EnvironmentCodeReportQuery['filters']['plants']) {
  if (!plants || plants.length === 0) return sql.fragment`true`;

  const includeEmpty = plants.includes(EXPLICIT_EMPTY);
  const inArrayFragment = sql.fragment`plant = ANY(${sql.array(plants, 'text')})`;
  return includeEmpty ? sql.fragment`(${inArrayFragment} OR plant IS NULL)` : inArrayFragment;
}

function filterReasonForEnvironmentalInvestmentFragment(
  reasonsForEnvironmentalInvestment?: EnvironmentCodeReportQuery['filters']['reasonsForEnvironmentalInvestment']
) {
  if (!reasonsForEnvironmentalInvestment || reasonsForEnvironmentalInvestment.length === 0)
    return sql.fragment`true`;

  const includeEmpty = reasonsForEnvironmentalInvestment.includes(EXPLICIT_EMPTY);
  const inArrayFragment = sql.fragment`"reasonForEnvironmentalInvestment" = ANY(${sql.array(
    reasonsForEnvironmentalInvestment,
    'text'
  )})`;
  return includeEmpty
    ? sql.fragment`(${inArrayFragment} OR "reasonForEnvironmentalInvestment" IS NULL)`
    : inArrayFragment;
}

function environmentCodeReportFragment(params?: Partial<EnvironmentCodeReportQuery>) {
  const years = params?.filters?.years ?? [];
  return sql.fragment`
    WITH total_actuals AS (
      SELECT
        wbs_element_id,
        sum(value_in_currency_subunit) FILTER (WHERE entry_type = 'DEBIT') AS "totalDebit",
        sum(value_in_currency_subunit) FILTER (WHERE entry_type = 'CREDIT') AS "totalCredit",
        sum(value_in_currency_subunit) AS "totalActuals"
      FROM app.sap_actuals_item
      ${
        years.length > 0
          ? sql.fragment`
        WHERE fiscal_year = ANY(${sql.array(years, 'int4')})
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
        environment_code.text_fi "reasonForEnvironmentalInvestmentText",
        network.company_code "companyCode",
        company_code.text_fi "companyCodeText"
      FROM
        app.sap_wbs wbs
        LEFT JOIN app.sap_project project ON project.sap_project_internal_id = wbs.sap_project_internal_id
        LEFT JOIN app.sap_network network ON network.wbs_internal_id = wbs.wbs_internal_id
        LEFT JOIN app.code company_code ON company_code.id = ('Kumppani', network.company_code)::app.code_id
        LEFT JOIN app.code environment_code ON environment_code.id = ('YmpäristönsuojelunSyy', wbs.reason_for_environmental_investment)::app.code_id
    )
    SELECT
      report.*,
      total_actuals."totalDebit",
      total_actuals."totalCredit",
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
    AND (${filterPlantFragment(params?.filters?.plants)})
    AND (${filterReasonForEnvironmentalInvestmentFragment(
      params?.filters?.reasonsForEnvironmentalInvestment
    )})
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
  const result = await getPool().any(sql.type(environmentCodeReportSchema)`
    ${environmentCodeReportFragment(query)}
    ${query.limit != null ? sql.fragment`LIMIT ${query.limit}` : sql.fragment``}
    ${query.offset != null ? sql.fragment`OFFSET ${query.offset}` : sql.fragment``}
  `);

  return z.array(environmentCodeReportSchema).parse(result);
}

export async function getEnvironmentCodeReportRowCount(
  filters: Pick<EnvironmentCodeReportQuery, 'filters'>
) {
  return await getPool().one(sql.type(
    z.object({
      rowCount: z.number(),
    })
  )`
    SELECT
      count(*) "rowCount"
    FROM (${environmentCodeReportFragment(filters)}) query
  `);
}

export async function getEnvironmentCodeReportSummary(
  filters: Pick<EnvironmentCodeReportQuery, 'filters'>
) {
  return await getPool().one(sql.type(
    z.object({
      totalDebitSum: z.number(),
      totalCreditSum: z.number(),
      totalActualsSum: z.number(),
    })
  )`
    SELECT
      sum("totalDebit") "totalDebitSum",
      sum("totalCredit") "totalCreditSum",
      sum("totalActuals") "totalActualsSum"
    FROM (${environmentCodeReportFragment(filters)}) query
  `);
}
