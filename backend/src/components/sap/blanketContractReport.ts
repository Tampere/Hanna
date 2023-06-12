import { z } from 'zod';

import { getPool, sql } from '@backend/db';

import { BlanketContractReportQuery, blanketContractReportSchema } from '@shared/schema/sapReport';

function blanketContractReportFragment(query?: Partial<BlanketContractReportQuery>) {
  // TODO use filters
  return sql.fragment`
    WITH total_actuals AS (
      SELECT wbs_element_id, sum(value_in_currency_subunit) AS "totalActuals"
      FROM app.sap_actuals_item
      GROUP BY wbs_element_id
    ), network_elements AS (
      SELECT
        network.network_id "networkId",
        network.network_name "networkName",
        project.project_manager_name "projectManagerName",
        network.created_at "networkCreatedAt",
        wbs.wbs_id "wbsId"
      FROM
        app.sap_network network
      LEFT JOIN app.sap_project project ON project.sap_project_internal_id = network.sap_project_internal_id
      LEFT JOIN app.sap_wbs wbs ON network.wbs_internal_id = wbs.wbs_internal_id
    )
    SELECT
      network_elements.*,
      total_actuals."totalActuals"
    FROM
      network_elements
      LEFT JOIN total_actuals ON network_elements."wbsId" = total_actuals.wbs_element_id
    ${
      query?.sort
        ? sql.fragment`ORDER BY ${sql.identifier([query.sort.key])} ${
            query.sort.direction === 'desc' ? sql.fragment`DESC` : sql.fragment`ASC`
          } NULLS LAST`
        : sql.fragment``
    }
  `;
}

export async function getBlanketContractReport(query: BlanketContractReportQuery) {
  return await getPool().any(sql.type(blanketContractReportSchema)`
    ${blanketContractReportFragment(query)}
    LIMIT ${query.limit}
    OFFSET ${query.offset}
  `);
}

export async function getBlanketContractReportRowCount(
  filters: BlanketContractReportQuery['filters']
) {
  const { count } = await getPool().one(sql.type(z.object({ count: z.number() }))`
    SELECT count(*) AS count
    FROM (${blanketContractReportFragment(filters)}) query
  `);
  return count;
}
