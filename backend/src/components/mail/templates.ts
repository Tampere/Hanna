/**
 * Parameters of each template directory under `backend/email-templates`.
 * The `production` flag is added automatically to every template.
 */

/** A label/value row rendered by `_partials/fields.pug`. */
export interface MailField {
  label: string;
  value: string | null;
}

const euroFormat = new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR' });

/** Formats an amount in cents as euros for request emails. */
export const formatEuros = (cents: number) => euroFormat.format(cents / 100);

/** Contact details of a user mentioned in a request email. */
export interface MailUserContact {
  name: string;
  email: string;
  /** Phone source is not decided yet - always null for now. */
  phone: string | null;
}

interface FinanceRequestBase {
  /** Name of the project or project object the request is about. */
  title: string;
  requestedBy: MailUserContact;
  fields: MailField[];
  /** Link to the target page in Hanna. */
  hannaUrl: string;
}

export interface MailTemplates {
  'sap-code-request': FinanceRequestBase & {
    isProjectObject: boolean;
    /** Direct link to the page where finance enters the SAP identifier. */
    financeUrl: string;
  };
  'purchase-request': FinanceRequestBase & {
    /** True when an already sent purchase request is sent again with changes. */
    isUpdate: boolean;
    purchaseOrderNumber: string | null;
    /** Direct link for entering the purchase order number, null once the number is set. */
    financeUrl: string | null;
  };
}
