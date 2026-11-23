import { CommonQueryMethods } from 'slonik';
import { z } from 'zod';

import { MailField, formatEuros as euros } from '@backend/components/mail/templates.js';
import { formatUserContact, getUserContact } from '@backend/components/mail/userContact.js';
import { sql } from '@backend/db.js';

import { PurchaseRequest, sumPhasePrices } from '@shared/schema/purchaseRequest.js';

/**
 * Fields shown in the purchase request email. Add, remove or reorder rows here -
 * the template renders whatever is returned.
 */

const contextSchema = z.object({
  projectName: z.string(),
  projectSapId: z.string().nullable(),
  sapWbsId: z.string().nullable(),
  businessId: z.string(),
  contact: z.string().nullable(),
  vatRate: z.string().nullable(),
});

const finnishDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-');
  return `${Number(day)}.${Number(month)}.${year}`;
};

export async function getPurchaseRequestFields(
  conn: CommonQueryMethods,
  request: PurchaseRequest,
): Promise<MailField[]> {
  const context = await conn.one(sql.type(contextSchema)`
    SELECT
      project.project_name AS "projectName",
      project.sap_project_id AS "projectSapId",
      project_object.sap_wbs_id AS "sapWbsId",
      company.business_id AS "businessId",
      (
        SELECT concat_ws(', ', contact.contact_name, contact.email_address, 'puh. ' || contact.phone_number)
        FROM app.company_contact contact
        WHERE contact.id = ${request.companyContactId}
      ) AS contact,
      (SELECT text_fi FROM app.code WHERE id = ('AlvKanta', ${request.vatRate})::app.code_id) AS "vatRate"
    FROM app.project_object
    INNER JOIN app.project ON project.id = project_object.project_id
    INNER JOIN app.company ON company.id = ${request.companyId}
    WHERE project_object.id = ${request.projectObjectId}
  `);

  const [responsiblePerson, orderer] = await Promise.all([
    getUserContact(request.responsiblePerson, conn),
    getUserContact(request.orderer, conn),
  ]);

  const phaseFields: MailField[] = request.phasePrices.map((phase) => ({
    label: `Vaihe ${phase.phaseCode}${phase.phaseName ? ` ${phase.phaseName}` : ''}`,
    value: euros(phase.amount),
  }));

  return [
    { label: 'Kohde', value: request.objectName },
    { label: 'Hanke', value: context.projectName },
    { label: 'SAP-projekti', value: context.projectSapId },
    { label: 'SAP WBS', value: context.sapWbsId },
    { label: 'Vastuuhenkilö', value: formatUserContact(responsiblePerson) },
    { label: 'Tilaaja', value: formatUserContact(orderer) },
    { label: 'Toimittaja', value: `${request.companyName} (${context.businessId})` },
    { label: 'Toimittajan yhteyshenkilö', value: context.contact },
    {
      label: 'Sopimuskausi',
      value: `${finnishDate(request.startDate)} - ${finnishDate(request.endDate)}`,
    },
    { label: 'Kustannuspaikka', value: `${request.costCenterName} (${request.costCenterId})` },
    {
      label: 'Puitesopimus',
      value:
        request.frameworkAgreementName && request.frameworkAgreementRecordId
          ? `${request.frameworkAgreementName} (${request.frameworkAgreementRecordId})`
          : request.frameworkAgreementName,
    },
    { label: 'ALV-kanta', value: context.vatRate },
    {
      label: 'Sovittu kokonaishinta (netto)',
      value:
        request.isContractPrice && request.contractPrice !== null
          ? euros(request.contractPrice)
          : null,
    },
    ...phaseFields,
    ...(phaseFields.length > 0
      ? [{ label: 'Vaiheet yhteensä', value: euros(sumPhasePrices(request.phasePrices)) }]
      : []),
    { label: 'Lisätietoja', value: request.additionalInfo },
  ];
}
