import { TRPCError } from '@trpc/server';
import { DatabaseTransactionConnection } from 'slonik';
import { z } from 'zod';

import { addAuditEvent } from '@backend/components/audit.js';
import { assertFrameworkAgreementSelectable } from '@backend/components/frameworkAgreement/index.js';
import { getUserContact } from '@backend/components/mail/userContact.js';
import {
  updateProjectObjectBudget,
  validateUpsertProjectObject,
} from '@backend/components/projectObject/index.js';
import {
  assertValid,
  dateText,
  getHannaUrl,
} from '@backend/components/sapIdentifier/index.js';
import { startSendMailJob } from '@backend/components/taskQueue/mailQueue.js';
import { getPool, sql } from '@backend/db.js';
import { env } from '@backend/env.js';
import { logger } from '@backend/logging.js';

import { BudgetUpdate } from '@shared/schema/projectObject/base.js';
import {
  PurchaseRequest,
  SetPurchaseOrderNumber,
  UpsertPurchaseRequest,
  contractPriceYear,
  costCenterSchema,
  forecastFromContractPrice,
  purchaseRequestDefaultsSchema,
  purchaseRequestSchema,
} from '@shared/schema/purchaseRequest.js';
import { User } from '@shared/schema/user.js';

import { getPurchaseRequestFields } from './mailFields.js';

/** Toimijat -> Urakoitsijan edustaja: the supplier contact of a purchase request. */
const CONTRACTOR_ROLE = sql.fragment`('KohdeKayttajaRooli', '06')::app.code_id`;

function badRequest(message: string): never {
  throw new TRPCError({ code: 'BAD_REQUEST', message });
}

export function getPurchaseRequestFinanceUrl(id: string) {
  return `${env.appUrl}/talous/ostotilaus/${id}`;
}

const projectTypeFragment = sql.fragment`
  CASE WHEN EXISTS (SELECT 1 FROM app.project_investment pi WHERE pi.id = project.id)
    THEN 'investmentProject' ELSE 'maintenanceProject' END
`;

const selectPurchaseRequest = sql.fragment`
  SELECT
    pr.id,
    project.id AS "projectId",
    pr.project_object_id AS "projectObjectId",
    project_object.object_name AS "objectName",
    ${projectTypeFragment} AS "projectType",
    pr.responsible_person AS "responsiblePerson",
    responsible.name AS "responsiblePersonName",
    pr.orderer,
    orderer.name AS "ordererName",
    pr.company_id AS "companyId",
    company.company_name AS "companyName",
    pr.company_contact_id AS "companyContactId",
    pr.start_date::text AS "startDate",
    ${dateText(sql.fragment`pr.end_date`)} AS "endDate",
    pr.cost_center_id AS "costCenterId",
    cost_center.name AS "costCenterName",
    pr.framework_agreement_id AS "frameworkAgreementId",
    framework_agreement.name AS "frameworkAgreementName",
    (pr.vat_rate).id AS "vatRate",
    pr.is_contract_price AS "isContractPrice",
    pr.contract_price AS "contractPrice",
    pr.phase_prices AS "phasePrices",
    pr.purchase_order_number AS "purchaseOrderNumber",
    pr.created_by AS "createdBy",
    pr.created_at AS "createdAt",
    pr.updated_at AS "updatedAt",
    pr.sent_at AS "sentAt"
  FROM app.purchase_request pr
  INNER JOIN app.project_object ON project_object.id = pr.project_object_id
  INNER JOIN app.project ON project.id = project_object.project_id
  INNER JOIN app.user responsible ON responsible.id = pr.responsible_person
  INNER JOIN app.user orderer ON orderer.id = pr.orderer
  INNER JOIN app.company ON company.id = pr.company_id
  INNER JOIN app.cost_center ON cost_center.id = pr.cost_center_id
  LEFT JOIN app.framework_agreement ON framework_agreement.id = pr.framework_agreement_id
`;

export async function listPurchaseRequests(
  projectObjectId: string,
): Promise<readonly PurchaseRequest[]> {
  return getPool().any(sql.type(purchaseRequestSchema)`
    ${selectPurchaseRequest}
    WHERE pr.project_object_id = ${projectObjectId} AND pr.deleted = false
    ORDER BY pr.created_at
  `);
}

export async function getPurchaseRequest(
  id: string,
  conn: Pick<DatabaseTransactionConnection, 'maybeOne'> = getPool(),
): Promise<PurchaseRequest> {
  const row = await conn.maybeOne(sql.type(purchaseRequestSchema)`
    ${selectPurchaseRequest}
    WHERE pr.id = ${id} AND pr.deleted = false
  `);
  if (!row) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'purchaseRequest.error.notFound' });
  }
  return row;
}

/** Budget row of the kohde for the given year, used for the contract price write-back. */
async function getBudgetForYear(
  conn: Pick<DatabaseTransactionConnection, 'one'>,
  projectObjectId: string,
  year: number,
) {
  const row = await conn.one(sql.type(
    z.object({
      contractPrice: z.number().nullable(),
      amount: z.number().nullable(),
      committee: z.string().nullable(),
    }),
  )`
    SELECT
      budget.contract_price AS "contractPrice",
      budget.amount,
      -- Keep the committee of an existing budget row, new rows get the object's committee.
      -- Maintenance kohteet have no committee.
      CASE
        WHEN budget.year IS NOT NULL THEN (budget.committee).id
        ELSE (SELECT (committee_type).id FROM app.project_object_committee poc
              WHERE poc.project_object_id = object.id LIMIT 1)
      END AS committee
    FROM app.project_object object
    LEFT JOIN app.budget ON budget.project_object_id = object.id AND budget.year = ${year}
    WHERE object.id = ${projectObjectId}
  `);
  return { year, ...row };
}

export async function getPurchaseRequestDefaults(projectObjectId: string) {
  return getPool().transaction(async (tx) => {
    const row = await tx.maybeOne(sql.type(
      purchaseRequestDefaultsSchema.omit({ contractPriceYear: true, contractPrice: true }),
    )`
      SELECT
        object.object_name AS "objectName",
        object.sap_wbs_id AS "sapWbsId",
        ${dateText(sql.fragment`object.start_date`)} AS "startDate",
        ${dateText(sql.fragment`object.end_date`)} AS "endDate",
        contact.company_id AS "companyId",
        contact.id AS "companyContactId",
        poi.project_object_id IS NOT NULL AS "hasFrameworkAgreement",
        poi.framework_agreement_id AS "frameworkAgreementId",
        (
          SELECT r.request_data->>'costCenterId'
          FROM app.sap_identifier_request r
          WHERE r.project_object_id = object.id
          ORDER BY r.requested_at DESC
          LIMIT 1
        ) AS "costCenterId"
      FROM app.project_object object
      LEFT JOIN app.project_object_investment poi ON poi.project_object_id = object.id
      LEFT JOIN LATERAL (
        SELECT company_contact.id, company_contact.company_id
        FROM app.project_object_user_role role
        INNER JOIN app.company_contact ON company_contact.id = role.company_contact_id
        WHERE role.project_object_id = object.id
          AND role.role = ${CONTRACTOR_ROLE}
          AND company_contact.deleted IS NOT TRUE
        LIMIT 1
      ) contact ON true
      WHERE object.id = ${projectObjectId} AND object.deleted = false
    `);
    if (!row) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }
    const year =
      row.startDate && row.endDate
        ? contractPriceYear(row.startDate, row.endDate)
        : new Date().getFullYear();
    const budget = await getBudgetForYear(tx, projectObjectId, year);
    return { ...row, contractPriceYear: year, contractPrice: budget.contractPrice };
  });
}

export async function getCostCentersWithPhases() {
  return getPool().any(sql.type(costCenterSchema)`
    SELECT
      cost_center.id,
      cost_center.name,
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object('phaseCode', phase.phase_code, 'name', phase.name)
            ORDER BY phase.sort_order, phase.phase_code
          )
          FROM app.cost_center_phase phase
          WHERE phase.cost_center_id = cost_center.id
        ),
        '[]'::jsonb
      ) AS phases
    FROM app.cost_center
    WHERE cost_center.deleted = false
    ORDER BY cost_center.id
  `);
}

async function validateInput(tx: DatabaseTransactionConnection, input: UpsertPurchaseRequest) {
  const object = await tx.maybeOne(sql.type(
    z.object({
      sapWbsId: z.string().nullable(),
      isInvestment: z.boolean(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
    }),
  )`
    SELECT
      object.sap_wbs_id AS "sapWbsId",
      ${dateText(sql.fragment`object.start_date`)} AS "startDate",
      ${dateText(sql.fragment`object.end_date`)} AS "endDate",
      EXISTS (
        SELECT 1 FROM app.project_object_investment poi WHERE poi.project_object_id = object.id
      ) AS "isInvestment"
    FROM app.project_object object
    WHERE object.id = ${input.projectObjectId} AND object.deleted = false
  `);
  if (!object) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }
  if (!object.sapWbsId) {
    badRequest('purchaseRequest.error.wbsMissing');
  }

  const costCenter = await tx.maybeOne(sql.untyped`
    SELECT 1 FROM app.cost_center WHERE id = ${input.costCenterId} AND deleted = false
  `);
  if (!costCenter) {
    badRequest('purchaseRequest.error.invalidCostCenter');
  }

  const contact = await tx.maybeOne(sql.untyped`
    SELECT 1 FROM app.company_contact
    WHERE id = ${input.companyContactId} AND company_id = ${input.companyId}
  `);
  if (!contact) {
    badRequest('purchaseRequest.error.contactNotInCompany');
  }

  // Dates are the kohde's dates: changing them runs the normal kohde validation
  const datesChanged = object.startDate !== input.startDate || object.endDate !== input.endDate;
  if (datesChanged) {
    assertValid(
      await validateUpsertProjectObject(tx, {
        projectObjectId: input.projectObjectId,
        startDate: input.startDate,
        endDate: input.endDate,
      } as Parameters<typeof validateUpsertProjectObject>[1]),
    );
  }

  const phaseCodes = input.phasePrices.map((phase) => phase.phaseCode);
  if (new Set(phaseCodes).size !== phaseCodes.length) {
    badRequest('purchaseRequest.error.duplicatePhase');
  }
  // Phases must belong to the selected cost centre. Names come from the mapping, not the client.
  const mappedPhases = await tx.any(sql.type(z.object({ phaseCode: z.string(), name: z.string() }))`
    SELECT phase_code AS "phaseCode", name
    FROM app.cost_center_phase
    WHERE cost_center_id = ${input.costCenterId}
      AND phase_code = ANY(${sql.array(phaseCodes, 'text')})
  `);
  if (mappedPhases.length !== phaseCodes.length) {
    badRequest('purchaseRequest.error.phaseNotInCostCenter');
  }
  const phasePrices = input.phasePrices.map((phase) => ({
    ...phase,
    phaseName:
      mappedPhases.find((mapped) => mapped.phaseCode === phase.phaseCode)?.name ?? phase.phaseName,
  }));

  if (input.frameworkAgreementId) {
    await assertFrameworkAgreementSelectable(
      tx,
      input.frameworkAgreementId,
      input.projectObjectId,
    );
  }

  return { ...object, datesChanged, phasePrices };
}

/**
 * Writes the prefilled Hanna fields back to the kohde when they were changed:
 * - start and end date (validated in validateInput)
 * - supplier contact: added as Urakoitsijan edustaja if not one already. Existing contacts
 *   are kept, as a kohde can have several suppliers with their own purchase requests.
 * - framework agreement (investment kohteet only, maintenance kohteet have no column)
 * - contract price + forecast, only when "Sopimushinta" is selected
 */
async function writeBackToProjectObject(
  tx: DatabaseTransactionConnection,
  input: UpsertPurchaseRequest,
  { isInvestment, datesChanged }: { isInvestment: boolean; datesChanged: boolean },
  userId: User['id'],
) {
  if (datesChanged) {
    await addAuditEvent(tx, {
      eventType: 'purchaseRequest.updateProjectObjectDates',
      eventData: {
        projectObjectId: input.projectObjectId,
        startDate: input.startDate,
        endDate: input.endDate,
      },
      eventUser: userId,
    });
    await tx.query(sql.untyped`
      UPDATE app.project_object
      SET start_date = ${input.startDate},
          end_date = ${input.endDate},
          updated_by = ${userId}
      WHERE id = ${input.projectObjectId}
    `);
  }

  const isContractor = await tx.maybeOne(sql.untyped`
    SELECT 1 FROM app.project_object_user_role
    WHERE project_object_id = ${input.projectObjectId}
      AND role = ${CONTRACTOR_ROLE}
      AND company_contact_id = ${input.companyContactId}
  `);
  if (!isContractor) {
    await addAuditEvent(tx, {
      eventType: 'purchaseRequest.addContractorContact',
      eventData: { projectObjectId: input.projectObjectId, companyContactId: input.companyContactId },
      eventUser: userId,
    });
    await tx.query(sql.untyped`
      INSERT INTO app.project_object_user_role (company_contact_id, project_object_id, role)
      VALUES (${input.companyContactId}, ${input.projectObjectId}, ${CONTRACTOR_ROLE})
    `);
  }

  if (isInvestment) {
    const current = await tx.one(sql.type(
      z.object({ frameworkAgreementId: z.string().nullable() }),
    )`
      SELECT framework_agreement_id AS "frameworkAgreementId"
      FROM app.project_object_investment
      WHERE project_object_id = ${input.projectObjectId}
    `);
    if (current.frameworkAgreementId !== input.frameworkAgreementId) {
      await addAuditEvent(tx, {
        eventType: 'purchaseRequest.updateFrameworkAgreement',
        eventData: {
          projectObjectId: input.projectObjectId,
          previous: current.frameworkAgreementId,
          frameworkAgreementId: input.frameworkAgreementId,
        },
        eventUser: userId,
      });
      await tx.query(sql.untyped`
        UPDATE app.project_object_investment
        SET framework_agreement_id = ${input.frameworkAgreementId}
        WHERE project_object_id = ${input.projectObjectId}
      `);
    }
  }

  if (input.isContractPrice && input.contractPrice !== null) {
    const year = contractPriceYear(input.startDate, input.endDate);
    const budget = await getBudgetForYear(tx, input.projectObjectId, year);
    if (budget.contractPrice !== input.contractPrice) {
      // Same rule as the budget table: forecast = contract price - amount.
      // Audit event is added by updateProjectObjectBudget.
      await updateProjectObjectBudget(
        tx,
        input.projectObjectId,
        [
          {
            year,
            contractPrice: input.contractPrice,
            forecast: forecastFromContractPrice(input.contractPrice, budget.amount),
            committee: budget.committee,
          },
        ] as BudgetUpdate['budgetItems'],
        userId,
      );
    }
  }
}

async function sendPurchaseRequestMail(
  tx: DatabaseTransactionConnection,
  request: PurchaseRequest,
  isUpdate: boolean,
  user: User,
) {
  if (env.email.financeRecipients.length === 0) {
    logger.warn('EMAIL_FINANCE_RECIPIENTS is empty, purchase request mail not sent');
    return;
  }

  const fields = await getPurchaseRequestFields(tx, request);
  const requestedBy = await getUserContact(user.id, tx);
  const target = { projectId: request.projectId, projectObjectId: request.projectObjectId };

  await startSendMailJob({
    mail: {
      to: env.email.financeRecipients,
      replyTo: requestedBy.email || undefined,
      template: {
        name: 'purchase-request',
        parameters: {
          title: request.objectName,
          requestedBy,
          fields,
          hannaUrl: getHannaUrl(request.projectType, target),
          isUpdate,
          purchaseOrderNumber: request.purchaseOrderNumber,
          // Finance only needs the link while the order number is missing
          financeUrl: request.purchaseOrderNumber
            ? null
            : getPurchaseRequestFinanceUrl(request.id),
        },
      },
    },
    userId: user.id,
    projectId: request.projectId,
  });
}

/**
 * Creates a purchase request or replaces an existing one, and sends it to finance.
 * Sending again replaces the old request (only the audit log keeps the history).
 */
export async function upsertPurchaseRequest(input: UpsertPurchaseRequest, user: User) {
  return getPool().transaction(async (tx) => {
    const validated = await validateInput(tx, input);

    let existing: { sentAt: Date | null } | null = null;
    if (input.id) {
      existing = await tx.maybeOne(sql.type(z.object({ sentAt: z.date().nullable() }))`
        SELECT sent_at AS "sentAt"
        FROM app.purchase_request
        WHERE id = ${input.id}
          AND project_object_id = ${input.projectObjectId}
          AND deleted = false
        FOR UPDATE
      `);
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'purchaseRequest.error.notFound' });
      }
    }

    await addAuditEvent(tx, {
      eventType: input.id ? 'purchaseRequest.update' : 'purchaseRequest.create',
      eventData: input,
      eventUser: user.id,
    });

    await writeBackToProjectObject(tx, input, validated, user.id);

    const values = {
      responsible_person: input.responsiblePerson,
      orderer: input.orderer,
      company_id: input.companyId,
      company_contact_id: input.companyContactId,
      start_date: input.startDate,
      end_date: input.endDate,
      cost_center_id: input.costCenterId,
      framework_agreement_id: input.frameworkAgreementId,
      is_contract_price: input.isContractPrice,
      contract_price: input.isContractPrice ? input.contractPrice : null,
      updated_by: user.id,
    };
    const vatRate = sql.fragment`('AlvKanta', ${input.vatRate})::app.code_id`;
    const phasePrices = sql.fragment`${JSON.stringify(validated.phasePrices)}::jsonb`;

    const { id } = input.id
      ? await tx.one(sql.type(z.object({ id: z.string() }))`
          UPDATE app.purchase_request
          SET ${sql.join(
            Object.entries(values).map(
              ([column, value]) => sql.fragment`${sql.identifier([column])} = ${value}`,
            ),
            sql.fragment`, `,
          )},
            vat_rate = ${vatRate},
            phase_prices = ${phasePrices},
            updated_at = now(),
            sent_at = now()
          WHERE id = ${input.id}
          RETURNING id
        `)
      : await tx.one(sql.type(z.object({ id: z.string() }))`
          INSERT INTO app.purchase_request (
            project_object_id,
            ${sql.join(
              Object.keys(values).map((column) => sql.identifier([column])),
              sql.fragment`, `,
            )},
            vat_rate, phase_prices, created_by, sent_at
          )
          VALUES (
            ${input.projectObjectId},
            ${sql.join(Object.values(values), sql.fragment`, `)},
            ${vatRate}, ${phasePrices}, ${user.id}, now()
          )
          RETURNING id
        `);

    const request = await getPurchaseRequest(id, tx);
    await sendPurchaseRequestMail(tx, request, Boolean(existing?.sentAt), user);
    return request;
  });
}

/** Finance office sets (or corrects) the purchase order number. */
export async function setPurchaseOrderNumber(input: SetPurchaseOrderNumber, user: User) {
  return getPool().transaction(async (tx) => {
    const current = await tx.maybeOne(sql.type(
      z.object({ purchaseOrderNumber: z.string().nullable() }),
    )`
      SELECT purchase_order_number AS "purchaseOrderNumber"
      FROM app.purchase_request
      WHERE id = ${input.id} AND deleted = false
      FOR UPDATE
    `);
    if (!current) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'purchaseRequest.error.notFound' });
    }

    await addAuditEvent(tx, {
      eventType: 'purchaseRequest.setPurchaseOrderNumber',
      eventData: { ...input, previous: current.purchaseOrderNumber },
      eventUser: user.id,
    });

    await tx.query(sql.untyped`
      UPDATE app.purchase_request
      SET purchase_order_number = ${input.purchaseOrderNumber},
          purchase_order_number_set_by = ${user.id},
          purchase_order_number_set_at = now()
      WHERE id = ${input.id}
    `);

    return getPurchaseRequest(input.id, tx);
  });
}

/**
 * Admin removes a purchase request (soft delete). Values already written back to the kohde
 * (dates, contractor role, framework agreement, budget) are left as they are, and no mail is sent.
 */
export async function deletePurchaseRequest(id: string, user: User) {
  return getPool().transaction(async (tx) => {
    const current = await tx.maybeOne(sql.untyped`
      SELECT id FROM app.purchase_request WHERE id = ${id} AND deleted = false FOR UPDATE
    `);
    if (!current) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'purchaseRequest.error.notFound' });
    }

    await addAuditEvent(tx, {
      eventType: 'purchaseRequest.delete',
      eventData: { id },
      eventUser: user.id,
    });

    await tx.query(sql.untyped`
      UPDATE app.purchase_request
      SET deleted = true, updated_by = ${user.id}, updated_at = now()
      WHERE id = ${id}
    `);
  });
}
