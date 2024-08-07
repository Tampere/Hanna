import { z } from 'zod';

import { getPool, sql, textToTsQuery } from '@backend/db.js';

import {
  BlanketContractReportQuery,
  blanketContractReportSchema,
} from '@shared/schema/sapReport.js';

function filterBlanketOrderIdsFragment(blanketOrderIds: string[]) {
  return blanketOrderIds.length > 0
    ? sql.fragment`"blanketOrderId" = ANY(${sql.array(blanketOrderIds, 'text')})`
    : sql.fragment`true`;
}

function blanketContractReportFragment(params?: Partial<BlanketContractReportQuery>) {
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
        WHERE fiscal_year = ANY(${sql.array(years, 'int4')}) AND document_type <> 'AA'
      `
          : sql.fragment`WHERE document_type <> 'AA'`
      }
      GROUP BY wbs_element_id
    ), report_items AS (
      SELECT
        project.sap_project_id "projectId",
        network.network_id "networkId",
        network.network_name "networkName",
        project.project_manager_name "projectManagerName",
        wbs.consult_company "consultCompany",
        wbs.decision_maker "decisionMaker",
        wbs.decision_date_text "decisionDateText",
        wbs.blanket_order_id AS "blanketOrderId",
        wbs.contract_price_in_currency_subunit "contractPriceInCurrencySubunit",
        wbs.wbs_id "wbsId"
      FROM
        app.sap_wbs wbs
      LEFT JOIN app.sap_network network ON wbs.wbs_internal_id = network.wbs_internal_id
      LEFT JOIN app.sap_project project ON project.sap_project_internal_id = network.sap_project_internal_id
      WHERE network.network_id IS NOT NULL
    )
    SELECT
      report_items.*,
      total_actuals."totalDebit",
      total_actuals."totalCredit",
      total_actuals."totalActuals"
    FROM
      report_items
      LEFT JOIN total_actuals ON report_items."wbsId" = total_actuals.wbs_element_id
    WHERE
      "totalActuals" IS NOT NULL
    AND
      ${
        params?.filters?.text
          ? sql.fragment`
          ${textToTsQuery(params?.filters?.text)}
          @@ to_tsvector(
            'simple',
            concat_ws(' ', "projectId", "networkId", "networkName", "projectManagerName", "decisionMaker")
          )`
          : sql.fragment`true`
      }
    AND ${
      params?.filters?.consultCompanies.length
        ? sql.fragment`"consultCompany" = ANY(${sql.array(
            params.filters.consultCompanies,
            'text',
          )})`
        : sql.fragment`true`
    }
    AND ${filterBlanketOrderIdsFragment(params?.filters?.blanketOrderIds ?? [])}
    ${
      params?.sort
        ? sql.fragment`ORDER BY ${sql.identifier([params.sort.key])} ${
            params.sort.direction === 'desc' ? sql.fragment`DESC` : sql.fragment`ASC`
          } NULLS LAST`
        : sql.fragment``
    }
  `;
}

export async function getBlanketContractReport(query: BlanketContractReportQuery) {
  const result = await getPool().any(sql.type(blanketContractReportSchema)`
    ${blanketContractReportFragment(query)}
    ${query.limit != null ? sql.fragment`LIMIT ${query.limit}` : sql.fragment``}
    ${query.offset != null ? sql.fragment`OFFSET ${query.offset}` : sql.fragment``}
  `);

  // Harmonize blanket contract id to include "TRE:" prefix if it's missing
  result.forEach((row) => {
    if (row.blanketOrderId && !row.blanketOrderId.startsWith('TRE:')) {
      row.blanketOrderId = `TRE:${row.blanketOrderId}`;
    }
  });
  return z.array(blanketContractReportSchema).parse(result);
}

export async function getBlanketContractReportRowCount(
  filters: Pick<BlanketContractReportQuery, 'filters'>,
) {
  return await getPool().one(sql.type(
    z.object({
      rowCount: z.number(),
    }),
  )`
    SELECT
      count(*) "rowCount"
    FROM (${blanketContractReportFragment(filters)}) query
  `);
}

export async function getBlanketContractReportSummary(
  filters: Pick<BlanketContractReportQuery, 'filters'>,
) {
  return await getPool().one(sql.type(
    z.object({
      totalDebitSum: z.number(),
      totalCreditSum: z.number(),
      totalActualsSum: z.number(),
    }),
  )`
    SELECT
      sum("totalDebit") "totalDebitSum",
      sum("totalCredit") "totalCreditSum",
      sum("totalActuals") "totalActualsSum"
    FROM (${blanketContractReportFragment(filters)}) query
  `);
}
