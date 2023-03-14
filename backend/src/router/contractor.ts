import { z } from 'zod';

import { addAuditEvent } from '@backend/components/audit';
import { getPool, sql } from '@backend/db';
import { TRPC } from '@backend/router';

import { nonEmptyString } from '@shared/schema/common';
import {
  companyIdSchema,
  companySchema,
  contractorIdSchema,
  contractorSchema,
  searchQuerySchema,
  searchResultSchema,
} from '@shared/schema/contractor';

const selectCompanyFragment = sql.fragment`
  SELECT
    business_id AS "businessId",
    company_name AS "companyName"
  FROM app.contractor_company
  WHERE deleted IS FALSE
`;

export const createContractorRouter = (t: TRPC) =>
  t.router({
    upsertCompany: t.procedure.input(companySchema).mutation(async ({ ctx, input }) => {
      await getPool().transaction(async (tx) => {
        await addAuditEvent(tx, {
          eventType: 'contractor.upsertCompany',
          eventData: input,
          eventUser: ctx.user.id,
        });
        await tx.any(sql.untyped`
          INSERT INTO app.contractor_company (business_id, company_name, modified_by)
          VALUES (${input.businessId}, ${input.companyName}, ${ctx.user.id})
          ON CONFLICT (business_id)
          DO UPDATE SET company_name = ${input.companyName}, modified_by = ${ctx.user.id}
        `);
      });
    }),

    deleteCompany: t.procedure.input(companyIdSchema).mutation(async ({ ctx, input }) => {
      await getPool().transaction(async (tx) => {
        await addAuditEvent(tx, {
          eventType: 'contractor.deleteCompany',
          eventData: input,
          eventUser: ctx.user.id,
        });
        await tx.any(sql.untyped`
          UPDATE app.contractor_company
          SET deleted = TRUE, modified_by = ${ctx.user.id}
          WHERE business_id = ${input.businessId}
        `);
      });
    }),

    getCompanies: t.procedure.query(async () => {
      const result = await getPool().any(sql.untyped`
        ${selectCompanyFragment}
        ORDER BY company_name
      `);
      return z.array(companySchema).parse(result);
    }),

    getCompanyById: t.procedure.input(companyIdSchema).query(async ({ input }) => {
      const result = await getPool().one(sql.untyped`
        ${selectCompanyFragment}
        AND business_id = ${input.businessId}
      `);
      return companySchema.parse(result);
    }),

    upsertContractor: t.procedure.input(contractorSchema).mutation(async ({ ctx, input }) => {
      const data = {
        contact_name: input.contactName,
        phone_number: input.phoneNumber,
        email_address: input.emailAddress,
        business_id: input.businessId,
        modified_by: ctx.user.id,
      };

      const identifiers = Object.keys(data).map((key) => sql.identifier([key]));
      const values = Object.values(data);

      await getPool().transaction(async (tx) => {
        await addAuditEvent(tx, {
          eventType: 'contractor.upsertContractor',
          eventData: input,
          eventUser: ctx.user.id,
        });

        if (input.id) {
          await tx.any(sql.untyped`
            UPDATE app.contractor
            SET (${sql.join(identifiers, sql.fragment`,`)}) = (${sql.join(values, sql.fragment`,`)})
            WHERE id = ${input.id}
          `);
        } else {
          await tx.any(sql.untyped`
            INSERT INTO app.contractor (${sql.join(identifiers, sql.fragment`,`)})
            VALUES (${sql.join(values, sql.fragment`,`)})
          `);
        }
      });
    }),

    getContractorById: t.procedure
      .input(z.object({ id: nonEmptyString }))
      .query(async ({ input }) => {
        return getPool().one(sql.type(searchResultSchema)`
          SELECT
            id,
            contact_name AS "contactName",
            phone_number AS "phoneNumber",
            email_address AS "emailAddress",
            contractor.business_id AS "businessId",
            company_name AS "companyName"
          FROM app.contractor
          LEFT JOIN app.contractor_company ON contractor.business_id = contractor_company.business_id
          WHERE contractor.deleted IS FALSE
            AND id = ${input.id}
        `);
      }),

    deleteContractor: t.procedure.input(contractorIdSchema).mutation(async ({ ctx, input }) => {
      await getPool().transaction(async (tx) => {
        await addAuditEvent(tx, {
          eventType: 'contractor.deleteContractor',
          eventData: input,
          eventUser: ctx.user.id,
        });
        await tx.any(sql.untyped`
          UPDATE app.contractor
          SET deleted = TRUE, modified_by = ${ctx.user.id}
          WHERE id = ${input.id}
        `);
      });
    }),

    search: t.procedure.input(searchQuerySchema).query(async ({ input }) => {
      const resultsSchema = z.array(searchResultSchema);
      const searchTerm =
        input.query
          .trim()
          .split(' ')
          .filter((term) => term.length > 0)
          .map((term) => `${term}:*`)
          .join(' & ') || null;

      const result = await getPool().any(sql.type(resultsSchema)`
        WITH contacts AS (
            SELECT
                id,
                contact_name,
                phone_number,
                email_address,
                contractor_company.company_name AS company_name,
                contractor_company.business_id,
                to_tsvector(
                  'simple',
                  concat_ws(' ', contact_name, replace(email_address, '@', ' '), company_name)
                ) AS ts_vec
            FROM app.contractor
            LEFT JOIN app.contractor_company ON contractor.business_id = contractor_company.business_id
            WHERE contractor.deleted IS FALSE
              AND contractor_company.deleted IS FALSE
        )
        SELECT
          id,
          contact_name AS "contactName",
          phone_number AS "phoneNumber",
          email_address AS "emailAddress",
          company_name AS "companyName",
          business_id AS "businessId"
        FROM contacts
        WHERE ${searchTerm}::text IS NULL OR ts_vec @@ to_tsquery('simple', ${searchTerm})
        ORDER BY ts_rank(ts_vec, to_tsquery('simple', ${searchTerm})) DESC
        LIMIT 20;
      `);
      return resultsSchema.parse(result ?? []);
    }),
  });
