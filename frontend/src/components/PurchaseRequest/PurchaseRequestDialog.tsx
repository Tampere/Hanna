import { css } from '@emotion/react';
import { Delete } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormLabel,
  TextField,
  Typography,
} from '@mui/material';
import { useAtomValue } from 'jotai';
import { useEffect, useMemo, useState } from 'react';

import { trpc } from '@frontend/client';
import { CodeSelect } from '@frontend/components/forms/CodeSelect';
import { ConfirmDialog } from '@frontend/components/dialogs/ConfirmDialog';
import {
  CurrencyInput,
  formatCurrency,
  outlinedCurrencyField as currencyField,
} from '@frontend/components/forms/CurrencyInput';
import { DatePicker } from '@frontend/components/forms/DatePicker';
import { FrameworkAgreementSelect } from '@frontend/components/forms/FrameworkAgreementSelect';
import { MultiSelect } from '@frontend/components/forms/MultiSelect';
import { UserSelect } from '@frontend/components/forms/UserSelect';
import { useNotifications } from '@frontend/services/notification';
import { asyncUserAtom } from '@frontend/stores/auth';
import { useTranslations } from '@frontend/stores/lang';

import { isTranslationKey } from '@shared/language';
import {
  CostCenter,
  PurchaseRequest,
  contractPriceYear,
  sumPhasePrices,
} from '@shared/schema/purchaseRequest';
import { isAdmin } from '@shared/schema/userPermissions';

interface Values {
  /** User pick fields: default to the current user, stored only on the request. */
  responsiblePerson: string;
  orderer: string;
  /** Urakoitsijan edustaja of the kohde, added there if missing. */
  companyId: string | null;
  companyContactId: string | null;
  /** Kohde dates, written back when changed. */
  startDate: string | null;
  endDate: string | null;
  costCenterId: string | null;
  frameworkAgreementId: string | null;
  vatRate: string | null;
  isContractPrice: boolean;
  contractPrice: number | null;
  /** Phase prices by phase code, in cents. */
  phaseAmounts: Record<string, number | null>;
  /** Lisätietoja, stored on the request only. */
  additionalInfo: string;
}

interface Props {
  open: boolean;
  projectObjectId: string;
  isMaintenance: boolean;
  /** Existing request: opened read-only, can be edited and sent again. */
  purchaseRequestId?: string | null;
  canEdit: boolean;
  onClose: () => void;
}

const columns = css`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const twoColumns = css`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const sectionTitle = css`
  font-size: 1.25rem;
  font-weight: 600;
  color: #22437b;
`;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box
      css={css`
        display: flex;
        flex-direction: column;
        gap: 4px;
      `}
    >
      <FormLabel>{label}</FormLabel>
      {children}
    </Box>
  );
}

function valuesFromRequest(request: PurchaseRequest): Values {
  return {
    responsiblePerson: request.responsiblePerson,
    orderer: request.orderer,
    companyId: request.companyId,
    companyContactId: request.companyContactId,
    startDate: request.startDate,
    endDate: request.endDate,
    costCenterId: request.costCenterId,
    frameworkAgreementId: request.frameworkAgreementId,
    vatRate: request.vatRate,
    isContractPrice: request.isContractPrice,
    contractPrice: request.contractPrice,
    phaseAmounts: Object.fromEntries(
      request.phasePrices.map((phase) => [phase.phaseCode, phase.amount]),
    ),
    additionalInfo: request.additionalInfo ?? '',
  };
}

/** Purchase request (ostotilauspyyntö) dialog, Figma 6307-1003. */
export function PurchaseRequestDialog({
  open,
  projectObjectId,
  isMaintenance,
  purchaseRequestId,
  canEdit,
  onClose,
}: Readonly<Props>) {
  const tr = useTranslations();
  const notify = useNotifications();
  const utils = trpc.useUtils();
  const user = useAtomValue(asyncUserAtom);
  const isNew = !purchaseRequestId;

  const [editing, setEditing] = useState(isNew);
  const [values, setValues] = useState<Values | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const existing = trpc.purchaseRequest.get.useQuery(
    { id: purchaseRequestId as string },
    { enabled: open && !isNew },
  );
  const defaults = trpc.purchaseRequest.getDefaults.useQuery(
    { projectObjectId },
    { enabled: open },
  );
  const costCenters = trpc.purchaseRequest.getCostCenters.useQuery(undefined, {
    enabled: open,
    staleTime: 60 * 60 * 1000,
  });
  const companies = trpc.company.getAll.useQuery(undefined, { enabled: open });
  const contacts = trpc.company.getAllContacts.useQuery(undefined, { enabled: open });

  // Initialise once loaded; reset when the dialog is closed
  useEffect(() => {
    if (!open) {
      setValues(null);
      setEditing(isNew);
      return;
    }
    if (values) return;
    if (!isNew && existing.data) {
      setValues(valuesFromRequest(existing.data));
    } else if (isNew && defaults.data) {
      setValues({
        responsiblePerson: user.id,
        orderer: user.id,
        companyId: defaults.data.companyId,
        companyContactId: defaults.data.companyContactId,
        startDate: defaults.data.startDate,
        endDate: defaults.data.endDate,
        costCenterId: defaults.data.costCenterId,
        frameworkAgreementId: defaults.data.frameworkAgreementId,
        vatRate: '01',
        isContractPrice: false,
        contractPrice: defaults.data.contractPrice,
        phaseAmounts: {},
        additionalInfo: '',
      });
    }
  }, [open, existing.data, defaults.data]);

  function update<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  const selectedCostCenter =
    costCenters.data?.find((costCenter) => costCenter.id === values?.costCenterId) ?? null;

  /**
   * Phases of the selected cost centre. When viewing a sent request, phases priced earlier that
   * are no longer in the mapping are shown too; when editing, only mapped phases can be sent.
   */
  const phases = useMemo(() => {
    const mapped = selectedCostCenter?.phases ?? [];
    if (editing) return mapped;
    const saved = (existing.data?.phasePrices ?? [])
      .filter((price) => !mapped.some((phase) => phase.phaseCode === price.phaseCode))
      .map((price) => ({ phaseCode: price.phaseCode, name: price.phaseName }));
    return [...mapped, ...saved];
  }, [selectedCostCenter, existing.data, editing]);

  const phasePrices = phases
    .filter((phase) => values?.phaseAmounts[phase.phaseCode] != null)
    .map((phase) => ({
      phaseCode: phase.phaseCode,
      phaseName: phase.name,
      amount: values?.phaseAmounts[phase.phaseCode] as number,
    }));
  const phaseTotal = sumPhasePrices(phasePrices);
  const contractPriceDifference =
    values?.isContractPrice && values.contractPrice != null
      ? values.contractPrice - phaseTotal
      : null;

  const contactsOfCompany = (contacts.data ?? []).filter(
    (contact) => contact.companyId === values?.companyId,
  );
  const selectedCompany =
    companies.data?.find((company) => company.id === values?.companyId) ?? null;
  const selectedContact =
    contacts.data?.find((contact) => contact.id === values?.companyContactId) ?? null;

  const datesValid = Boolean(
    values?.startDate && values?.endDate && values.startDate <= values.endDate,
  );
  const isValid = Boolean(
    values &&
      values.responsiblePerson &&
      values.orderer &&
      values.companyId &&
      values.companyContactId &&
      datesValid &&
      values.costCenterId &&
      values.vatRate &&
      (!values.isContractPrice || values.contractPrice != null),
  );

  const upsert = trpc.purchaseRequest.upsert.useMutation({
    onSuccess: () => {
      utils.purchaseRequest.list.invalidate({ projectObjectId });
      utils.purchaseRequest.get.invalidate();
      utils.purchaseRequest.getDefaults.invalidate({ projectObjectId });
      // Dates, roles, framework agreement and budget may have changed
      utils.investmentProjectObject.get.invalidate();
      utils.maintenanceProjectObject.get.invalidate();
      utils.projectObject.getBudget.invalidate({ projectObjectId });
      notify({ severity: 'success', title: tr('purchaseRequest.notify.sent'), duration: 5000 });
      onClose();
    },
    onError: (error) => {
      notify({
        severity: 'error',
        title: tr('purchaseRequest.notify.failed'),
        message: isTranslationKey(error.message) ? tr(error.message) : undefined,
      });
    },
  });

  const remove = trpc.purchaseRequest.delete.useMutation({
    onSuccess: () => {
      utils.purchaseRequest.list.invalidate({ projectObjectId });
      utils.purchaseRequest.get.invalidate();
      utils.purchaseRequest.getDefaults.invalidate({ projectObjectId });
      notify({ severity: 'success', title: tr('purchaseRequest.notify.deleted'), duration: 5000 });
      setConfirmDelete(false);
      onClose();
    },
    onError: () => {
      notify({ severity: 'error', title: tr('purchaseRequest.notify.deleteFailed') });
      setConfirmDelete(false);
    },
  });
  const isBusy = upsert.isLoading || remove.isLoading;

  function send() {
    if (!values || !isValid) return;
    upsert.mutate({
      id: purchaseRequestId ?? null,
      projectObjectId,
      responsiblePerson: values.responsiblePerson,
      orderer: values.orderer,
      companyId: values.companyId as string,
      companyContactId: values.companyContactId as string,
      startDate: values.startDate as string,
      endDate: values.endDate as string,
      costCenterId: values.costCenterId as string,
      frameworkAgreementId: values.frameworkAgreementId,
      vatRate: values.vatRate as string,
      isContractPrice: values.isContractPrice,
      contractPrice: values.isContractPrice ? values.contractPrice : null,
      phasePrices,
      additionalInfo: values.additionalInfo.trim() || null,
    });
  }

  const readOnly = !editing;
  const isOngoing = values?.endDate === 'infinity';
  const title = isNew
    ? tr('purchaseRequest.dialog.titleNew')
    : editing
      ? tr('purchaseRequest.dialog.titleEdit')
      : tr('purchaseRequest.dialog.titleView');

  return (
    <Dialog open={open} onClose={isBusy ? undefined : onClose} maxWidth="lg" fullWidth>
      <DialogTitle
        css={css`
          font-size: 1.75rem;
          color: #22437b;
        `}
      >
        {title}
      </DialogTitle>
      <DialogContent>
        {editing && (
          <Typography
            variant="body2"
            css={css`
              margin-bottom: 16px;
            `}
          >
            {tr('purchaseRequest.dialog.info')}
          </Typography>
        )}
        {existing.data?.purchaseOrderNumber && (
          <Alert
            severity="success"
            css={css`
              margin-bottom: 16px;
            `}
          >
            {tr('purchaseRequest.dialog.orderNumber', existing.data.purchaseOrderNumber)}
          </Alert>
        )}

        {!values ? (
          <CircularProgress size="2rem" />
        ) : (
          <>
            <Box css={columns}>
              {/* Perustiedot */}
              <Box
                css={css`
                  display: flex;
                  flex-direction: column;
                  gap: 12px;
                `}
              >
                <Typography css={sectionTitle}>{tr('purchaseRequest.dialog.basicInfo')}</Typography>
                <Box css={twoColumns}>
                  <Field label={tr('purchaseRequest.field.responsiblePerson')}>
                    <UserSelect
                      value={values.responsiblePerson}
                      readOnly={readOnly}
                      onChange={(id) => update('responsiblePerson', id ?? '')}
                    />
                  </Field>
                  <Field label={tr('purchaseRequest.field.orderer')}>
                    <UserSelect
                      value={values.orderer}
                      readOnly={readOnly}
                      onChange={(id) => update('orderer', id ?? '')}
                    />
                  </Field>
                </Box>
                <Field label={tr('purchaseRequest.field.company')}>
                  <MultiSelect
                    options={companies.data ?? []}
                    loading={companies.isLoading}
                    readOnly={readOnly}
                    getOptionId={(company) => company.id as string}
                    getOptionLabel={(company) => `${company.companyName} (${company.businessId})`}
                    value={selectedCompany}
                    onChange={(company) =>
                      setValues((prev) =>
                        prev
                          ? { ...prev, companyId: company?.id ?? null, companyContactId: null }
                          : prev,
                      )
                    }
                    multiple={false}
                  />
                </Field>
                <Field label={tr('purchaseRequest.field.companyContact')}>
                  <MultiSelect
                    options={contactsOfCompany}
                    loading={contacts.isLoading}
                    readOnly={readOnly}
                    disabled={!values.companyId}
                    getOptionId={(contact) => contact.id}
                    getOptionLabel={(contact) =>
                      `${contact.contactName} (${contact.emailAddress}, ${contact.phoneNumber})`
                    }
                    value={selectedContact}
                    onChange={(contact) => update('companyContactId', contact?.id ?? null)}
                    multiple={false}
                  />
                </Field>
                <Box css={twoColumns}>
                  <Field label={tr('purchaseRequest.field.startDate')}>
                    <DatePicker
                      value={values.startDate}
                      readOnly={readOnly}
                      onChange={(date) => update('startDate', date)}
                    />
                  </Field>
                  <Field label={tr('purchaseRequest.field.endDate')}>
                    <DatePicker
                      value={isOngoing ? null : values.endDate}
                      readOnly={readOnly || isOngoing}
                      onChange={(date) => update('endDate', date)}
                    />
                    {isMaintenance && (
                      <FormControlLabel
                        label={tr('maintenanceProject.ongoing')}
                        control={
                          <Checkbox
                            size="small"
                            disabled={readOnly}
                            checked={isOngoing}
                            onChange={(_, checked) =>
                              update('endDate', checked ? 'infinity' : null)
                            }
                          />
                        }
                      />
                    )}
                  </Field>
                </Box>
                <Field label={tr('purchaseRequest.field.costCenter')}>
                  <MultiSelect<CostCenter>
                    options={costCenters.data ?? []}
                    loading={costCenters.isLoading}
                    readOnly={readOnly}
                    getOptionId={(costCenter) => costCenter.id}
                    getOptionLabel={(costCenter) => `(${costCenter.id}) ${costCenter.name}`}
                    value={selectedCostCenter}
                    onChange={(costCenter) => update('costCenterId', costCenter?.id ?? null)}
                    multiple={false}
                  />
                </Field>
                <Field label={tr('purchaseRequest.field.frameworkAgreement')}>
                  <FrameworkAgreementSelect
                    value={values.frameworkAgreementId}
                    readOnly={readOnly}
                    savedValue={defaults.data?.frameworkAgreementId}
                    onChange={(id) => update('frameworkAgreementId', id)}
                  />
                </Field>
                <Box css={twoColumns}>
                  <Field label={tr('purchaseRequest.field.vatRate')}>
                    <CodeSelect
                      codeListId="AlvKanta"
                      readOnly={readOnly}
                      value={values.vatRate ?? undefined}
                      onChange={(code) => update('vatRate', code)}
                    />
                  </Field>
                  <FormControlLabel
                    css={css`
                      align-self: end;
                    `}
                    label={tr('purchaseRequest.field.isContractPrice')}
                    control={
                      <Checkbox
                        disabled={readOnly}
                        checked={values.isContractPrice}
                        onChange={(_, checked) => update('isContractPrice', checked)}
                      />
                    }
                  />
                </Box>
                {values.isContractPrice && (
                  <Field label={`${tr('purchaseRequest.field.contractPrice')} *`}>
                    <Box css={currencyField(values.contractPrice == null)}>
                      <CurrencyInput
                        directlyHandleValueChange
                        style={{ width: '100%' }}
                        placeholder="–"
                        value={values.contractPrice}
                        onChange={readOnly ? undefined : (cents) => update('contractPrice', cents)}
                      />
                    </Box>
                    {editing && values.startDate && values.endDate && datesValid && (
                      <Typography variant="caption">
                        {tr(
                          'purchaseRequest.dialog.contractPriceYear',
                          contractPriceYear(values.startDate, values.endDate),
                        )}
                      </Typography>
                    )}
                  </Field>
                )}
              </Box>

              {/* Vaihekohtaiset hinnat */}
              <Box
                css={css`
                  display: flex;
                  flex-direction: column;
                  gap: 8px;
                `}
              >
                <Box
                  css={css`
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                  `}
                >
                  <Typography css={sectionTitle}>
                    {tr('purchaseRequest.dialog.phasePrices')}
                  </Typography>
                  {phases.length > 0 && (
                    <Typography variant="h6">
                      {tr('purchaseRequest.dialog.total', formatCurrency(phaseTotal))}
                    </Typography>
                  )}
                </Box>
                {phases.length > 0 &&
                  contractPriceDifference != null &&
                  contractPriceDifference !== 0 && (
                    <Typography
                      variant="body2"
                      css={css`
                        text-align: right;
                      `}
                    >
                      {tr(
                        contractPriceDifference > 0
                          ? 'purchaseRequest.dialog.contractPriceMissing'
                          : 'purchaseRequest.dialog.contractPriceExceeded',
                        formatCurrency(Math.abs(contractPriceDifference)),
                      )}
                    </Typography>
                  )}
                {!values.costCenterId && (
                  <Typography variant="body2">
                    {tr('purchaseRequest.dialog.selectCostCenter')}
                  </Typography>
                )}
                {values.costCenterId && phases.length === 0 && (
                  <Alert severity="info">{tr('purchaseRequest.dialog.noPhases')}</Alert>
                )}
                {phases.map((phase) => (
                  <Box
                    key={phase.phaseCode}
                    css={css`
                      display: grid;
                      grid-template-columns: 1fr 1fr;
                      align-items: center;
                      gap: 8px;
                      padding-left: 8px;
                    `}
                  >
                    <Typography variant="body2">
                      ({phase.phaseCode}) {phase.name}
                    </Typography>
                    <Box css={currencyField()}>
                      <CurrencyInput
                        directlyHandleValueChange
                        style={{ width: '100%' }}
                        placeholder="–"
                        value={values.phaseAmounts[phase.phaseCode] ?? null}
                        onChange={
                          readOnly
                            ? undefined
                            : (cents) =>
                                update('phaseAmounts', {
                                  ...values.phaseAmounts,
                                  [phase.phaseCode]: cents,
                                })
                        }
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
            <Box
              css={css`
                margin-top: 16px;
              `}
            >
              <Field label={tr('purchaseRequest.field.additionalInfo')}>
                <TextField
                  size="small"
                  multiline
                  minRows={3}
                  fullWidth
                  value={values.additionalInfo}
                  InputProps={{ readOnly }}
                  onChange={(event) => update('additionalInfo', event.target.value)}
                />
              </Field>
            </Box>
          </>
        )}
      </DialogContent>
      <Divider
        css={css`
          margin: 0 24px;
        `}
      />
      <DialogActions
        css={css`
          justify-content: space-between;
          padding: 16px 24px;
        `}
      >
        <Box
          css={css`
            display: flex;
            gap: 8px;
          `}
        >
          <Button variant="outlined" onClick={onClose} disabled={isBusy}>
            {editing ? tr('purchaseRequest.dialog.cancel') : tr('purchaseRequest.dialog.close')}
          </Button>
          {editing && !isNew && isAdmin(user.role) && (
            <Button
              onClick={() => setConfirmDelete(true)}
              disabled={isBusy}
              endIcon={<Delete />}
              css={(theme) => css`
                color: ${theme.palette.secondary.main};
              `}
            >
              {tr('genericForm.deleteBtnLabel')}
            </Button>
          )}
        </Box>
        {editing ? (
          <Button
            variant="contained"
            onClick={send}
            disabled={!isValid || isBusy}
            endIcon={upsert.isLoading ? <CircularProgress size="1rem" /> : undefined}
          >
            {tr('purchaseRequest.dialog.send')}
          </Button>
        ) : (
          canEdit && (
            <Button variant="contained" onClick={() => setEditing(true)}>
              {tr('purchaseRequest.dialog.editAndResend')}
            </Button>
          )
        )}
      </DialogActions>
      <ConfirmDialog
        cssProp={(theme) => css`
          & .delete-dialog-confirm-button {
            background-color: ${theme.palette.secondary.main};
          }
        `}
        isOpen={confirmDelete}
        title={tr('purchaseRequest.dialog.deleteTitle')}
        content={tr('purchaseRequest.dialog.deleteContent')}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => purchaseRequestId && remove.mutate({ id: purchaseRequestId })}
        cancelButtonVariant="contained"
        confirmButtonVariant="contained"
        cancelButtonLabel={tr('genericForm.undoBtnLabel')}
        confirmButtonLabel={tr('genericForm.deleteBtnLabel')}
      />
    </Dialog>
  );
}
