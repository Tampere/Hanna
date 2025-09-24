import { z } from 'zod';

import { addAuditEvent } from '@backend/components/audit.js';
import { getPool, sql } from '@backend/db.js';
import { TRPC } from '@backend/router/index.js';

import { nonEmptyString } from '@shared/schema/common.js';
import {
  companyContactIdSchema,
  companyContactSchema,
  companyContactSearchQuerySchema,
  companyContactSearchResultSchema,
  companyIdSchema,
  companySchema,
} from '@shared/schema/company.js';

const selectCompanyFragment = sql.fragment`
  SELECT
    business_id AS "businessId",
    company_name AS "companyName",
    id AS id
  FROM app.company
  WHERE deleted IS FALSE
`;

export function getAllContactsAndCompanies() {
  return getPool().any(sql.type(
    z.object({ id: nonEmptyString, contactName: z.string(), companyName: z.string() }),
  )`
      SELECT
        cc.id,
        cc.contact_name AS "contactName",
        c.company_name AS "companyName"
      FROM app.company_contact cc
      LEFT JOIN app.company c ON cc.company_id = c.id
      WHERE c.deleted IS FALSE AND cc.deleted IS FALSE
      ORDER BY LOWER(cc.contact_name) ASC`);
}

export const createCompanyRouter = (t: TRPC) =>
  t.router({
    upsert: t.procedure.input(companySchema).mutation(async ({ ctx, input }) => {
      await getPool().transaction(async (tx) => {
        await addAuditEvent(tx, {
          eventType: 'company.upsert',
          eventData: input,
          eventUser: ctx.user.id,
        });
        if (input.id) {
          await tx.any(sql.untyped`
            UPDATE app.company
            SET
              business_id = ${input.businessId},
              company_name = ${input.companyName},
              modified_by = ${ctx.user.id},
              modified_at = NOW()
            WHERE id = ${input.id}
              AND deleted IS FALSE
            RETURNING id; -- Return the ID of the updated company
          `);
        } else {
          await tx.query(sql.untyped`
            INSERT INTO app.company (
              business_id,
              company_name,
              modified_by,
              modified_at
            )
            VALUES (
              ${input.businessId},
              ${input.companyName},
              ${ctx.user.id},
              NOW()
            )`);
        }
      });
    }),

    delete: t.procedure.input(companyIdSchema).mutation(async ({ ctx, input }) => {
      await getPool().transaction(async (tx) => {
        await addAuditEvent(tx, {
          eventType: 'company.delete',
          eventData: input,
          eventUser: ctx.user.id,
        });
        await tx.any(sql.untyped`
          UPDATE app.company
          SET deleted = TRUE, modified_by = ${ctx.user.id}
          WHERE business_id = ${input.businessId}
        `);
      });
    }),

    search: t.procedure.input(z.string()).query(async ({ input }) => {
      const result = await getPool().any(sql.untyped`
        ${selectCompanyFragment}
          AND
          (company_name ILIKE ${`%${input}%`}
            OR
          business_id ILIKE ${`%${input}%`})
          ORDER BY company_name ASC
        `);
      return z.array(companySchema).parse(result);
    }),

    getAll: t.procedure.query(async () => {
      const result = await getPool().any(sql.untyped`
        ${selectCompanyFragment}
        ORDER BY company_name
      `);
      return z.array(companySchema).parse(result);
    }),

    getById: t.procedure.input(companyIdSchema).query(async ({ input }) => {
      const result = await getPool().one(sql.untyped`
        ${selectCompanyFragment}
        AND business_id = ${input.businessId}
      `);
      return companySchema.parse(result);
    }),

    upsertContact: t.procedure.input(companyContactSchema).mutation(async ({ ctx, input }) => {
      const data = {
        contact_name: input.contactName,
        phone_number: input.phoneNumber,
        email_address: input.emailAddress,
        company_id: input.companyId,
        modified_by: ctx.user.id,
      };

      const identifiers = Object.keys(data).map((key) => sql.identifier([key]));
      const values = Object.values(data);

      await getPool().transaction(async (tx) => {
        await addAuditEvent(tx, {
          eventType: 'company.upsertContact',
          eventData: input,
          eventUser: ctx.user.id,
        });

        if (input.id) {
          await tx.any(sql.untyped`
            UPDATE app.company_contact
            SET (${sql.join(identifiers, sql.fragment`,`)}) = (${sql.join(values, sql.fragment`,`)})
            WHERE id = ${input.id}
          `);
        } else {
          await tx.any(sql.untyped`
            INSERT INTO app.company_contact (${sql.join(identifiers, sql.fragment`,`)})
            VALUES (${sql.join(values, sql.fragment`,`)})
          `);
        }
      });
    }),

    getContactById: t.procedure.input(z.object({ id: nonEmptyString })).query(async ({ input }) => {
      return getPool().one(sql.type(companyContactSearchResultSchema)`
          SELECT
            company_contact.id,
            contact_name AS "contactName",
            phone_number AS "phoneNumber",
            email_address AS "emailAddress",
            company.id AS "companyId",
            company_name AS "companyName"
          FROM app.company_contact
          LEFT JOIN app.company ON company_contact.company_id = company.id
          WHERE company_contact.deleted IS FALSE
            AND company_contact.id = ${input.id}
        `);
    }),

    getAllContacts: t.procedure.query(async () => {
      return getPool().any(sql.type(companyContactSchema.required())`
      SELECT
        id,
        contact_name AS "contactName",
        phone_number AS "phoneNumber",
        email_address AS "emailAddress",
        company_id AS "companyId"
      FROM app.company_contact
      WHERE deleted IS FALSE`);
    }),

    getAllContactsAndCompanies: t.procedure.query(async () => {
      return getAllContactsAndCompanies();
    }),

    deleteContact: t.procedure.input(companyContactIdSchema).mutation(async ({ ctx, input }) => {
      await getPool().transaction(async (tx) => {
        await addAuditEvent(tx, {
          eventType: 'company.deleteContact',
          eventData: input,
          eventUser: ctx.user.id,
        });
        await tx.any(sql.untyped`
          UPDATE app.company_contact
          SET deleted = TRUE, modified_by = ${ctx.user.id}
          WHERE id = ${input.id}
        `);
      });
    }),

    searchContacts: t.procedure.input(companyContactSearchQuerySchema).query(async ({ input }) => {
      const resultsSchema = z.array(companyContactSearchResultSchema);
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
                company_contact.id AS id,
                contact_name,
                phone_number,
                email_address,
                company.company_name AS company_name,
                company.business_id AS business_id,
                company.id AS company_id,
                to_tsvector(
                  'simple',
                  concat_ws(' ', contact_name, replace(email_address, '@', ' '), company_name)
                ) AS ts_vec
            FROM app.company_contact
            LEFT JOIN app.company ON company_contact.company_id = company.id
            WHERE company_contact.deleted IS FALSE
              AND company.deleted IS FALSE
        )
        SELECT
          id,
          contact_name AS "contactName",
          phone_number AS "phoneNumber",
          email_address AS "emailAddress",
          company_name AS "companyName",
          business_id AS "businessId",
          company_id AS "companyId"
        FROM contacts
        WHERE ${searchTerm}::text IS NULL OR ts_vec @@ to_tsquery('simple', ${searchTerm})
        ORDER BY LOWER(contact_name), ts_rank(ts_vec, to_tsquery('simple', ${searchTerm})) DESC;
      `);
      return resultsSchema.parse(result ?? []);
    }),
  });
