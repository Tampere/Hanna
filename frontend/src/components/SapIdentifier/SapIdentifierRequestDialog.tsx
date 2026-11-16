import { css } from '@emotion/react';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormLabel,
  Typography,
} from '@mui/material';
import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';

import { trpc } from '@frontend/client';
import { CodeSelect } from '@frontend/components/forms/CodeSelect';
import { DatePicker } from '@frontend/components/forms/DatePicker';
import { MultiSelect } from '@frontend/components/forms/MultiSelect';
import { UserSelect } from '@frontend/components/forms/UserSelect';
import { useNotifications } from '@frontend/services/notification';
import { asyncUserAtom } from '@frontend/stores/auth';
import { useTranslations } from '@frontend/stores/lang';

import { isTranslationKey } from '@shared/language';
import type { CostCenterOption, SapIdentifierTarget } from '@shared/schema/sapIdentifierRequest';

export interface SapIdentifierRequestValues {
  /** User pick field: defaults to the current user, stored only on the request. */
  responsiblePerson: string;
  startDate: string | null;
  endDate: string | null;
  /** Kohde: Hankeluokka codes, prefilled from the kohde type. */
  projectObjectClass: string | null;
  serviceClasses: string[];
  costCenterId: string | null;
  environmentalInvestmentReason: string | null;
}

interface Props {
  open: boolean;
  target: SapIdentifierTarget;
  /** Values from an unsaved form, e.g. the "Ilmoita samalla" checkbox. Override the saved ones. */
  initialValues?: Partial<SapIdentifierRequestValues>;
  onClose: () => void;
  onSent?: () => void;
}

const fieldStyle = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const twoColumns = css`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box css={fieldStyle}>
      <FormLabel>{label}</FormLabel>
      {children}
    </Box>
  );
}

/** Request a SAP identifier for a hanke (Figma 6277-553) or kohde (Figma 6287-535). */
export function SapIdentifierRequestDialog({
  open,
  target,
  initialValues,
  onClose,
  onSent,
}: Readonly<Props>) {
  const tr = useTranslations();
  const notify = useNotifications();
  const utils = trpc.useUtils();
  const isProjectObject = Boolean(target.projectObjectId);
  const user = useAtomValue(asyncUserAtom);

  const defaults = trpc.sapIdentifier.getRequestDefaults.useQuery(target, { enabled: open });
  const costCenters = trpc.sapIdentifier.getCostCenters.useQuery(undefined, {
    enabled: open && isProjectObject,
    staleTime: 60 * 60 * 1000,
  });
  const serviceClassCodes = trpc.code.get.useQuery(
    { codeListId: 'Palveluluokka' },
    { enabled: open && !isProjectObject, staleTime: 60 * 60 * 1000 },
  );

  const [values, setValues] = useState<SapIdentifierRequestValues | null>(null);

  // Initialise from saved values once loaded; reset when the dialog is reopened
  useEffect(() => {
    if (!open) {
      setValues(null);
      return;
    }
    if (defaults.data && !values) {
      setValues({
        responsiblePerson: user.id,
        startDate: defaults.data.startDate,
        endDate: defaults.data.endDate,
        environmentalInvestmentReason: defaults.data.environmentalInvestmentReason,
        projectObjectClass: defaults.data.projectObjectClass,
        serviceClasses: [],
        costCenterId: null,
        ...initialValues,
      });
    }
  }, [open, defaults.data]);

  function invalidate() {
    utils.sapIdentifier.getStatus.invalidate(target);
    // Owner, dates and environmental code may have changed
    utils.investmentProject.get.invalidate();
    utils.maintenanceProject.get.invalidate();
    utils.investmentProjectObject.get.invalidate();
    utils.maintenanceProjectObject.get.invalidate();
  }

  const mutationOptions = {
    onSuccess: () => {
      invalidate();
      notify({
        severity: 'success',
        title: tr('sapIdentifier.notify.requestSent'),
        duration: 5000,
      });
      onSent?.();
      onClose();
    },
    onError: (error: { message: string }) => {
      notify({
        severity: 'error',
        title: tr('sapIdentifier.notify.requestFailed'),
        message: isTranslationKey(error.message) ? tr(error.message) : undefined,
      });
    },
  };
  const projectRequest = trpc.sapIdentifier.requestForProject.useMutation(mutationOptions);
  const projectObjectRequest =
    trpc.sapIdentifier.requestForProjectObject.useMutation(mutationOptions);
  const isSending = projectRequest.isLoading || projectObjectRequest.isLoading;

  function update<K extends keyof SapIdentifierRequestValues>(
    key: K,
    value: SapIdentifierRequestValues[K],
  ) {
    setValues((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  // 'infinity' = ongoing, compares greater than any ISO date like in the forms
  const datesValid = Boolean(
    values?.startDate && values?.endDate && values.startDate < values.endDate,
  );
  const isMaintenance = defaults.data?.projectType === 'maintenanceProject';
  const isOngoing = values?.endDate === 'infinity';
  const isValid = Boolean(
    values?.responsiblePerson &&
      datesValid &&
      (!isProjectObject || (values.costCenterId && values.projectObjectClass)),
  );

  function send() {
    if (!values || !isValid || !values.startDate || !values.endDate) return;
    if (target.projectObjectId) {
      projectObjectRequest.mutate({
        projectId: target.projectId,
        projectObjectId: target.projectObjectId,
        startDate: values.startDate,
        endDate: values.endDate,
        environmentalInvestmentReason: values.environmentalInvestmentReason,
        responsiblePerson: values.responsiblePerson,
        costCenterId: values.costCenterId as string,
        projectObjectClass: values.projectObjectClass as string,
      });
    } else {
      projectRequest.mutate({
        projectId: target.projectId,
        responsiblePerson: values.responsiblePerson,
        startDate: values.startDate,
        endDate: values.endDate,
        serviceClasses: values.serviceClasses,
      });
    }
  }

  const selectedCostCenter =
    costCenters.data?.find((costCenter) => costCenter.id === values?.costCenterId) ?? null;

  return (
    <Dialog open={open} onClose={isSending ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        css={css`
          font-size: 1.75rem;
          color: #22437b;
        `}
      >
        {tr('sapIdentifier.dialog.title')}
      </DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          css={css`
            margin-bottom: 16px;
          `}
        >
          {tr(
            isProjectObject
              ? 'sapIdentifier.dialog.info.projectObject'
              : 'sapIdentifier.dialog.info.project',
          )}
        </Typography>

        {!values ? (
          <CircularProgress size="2rem" />
        ) : (
          <Box
            css={css`
              display: flex;
              flex-direction: column;
              gap: 12px;
            `}
          >
            {isProjectObject ? (
              <>
                <Box css={twoColumns}>
                  <Field label={tr('sapIdentifier.field.owner')}>
                    <UserSelect
                      value={values.responsiblePerson}
                      onChange={(id) => update('responsiblePerson', id ?? '')}
                    />
                  </Field>
                  <Field label={tr('sapIdentifier.field.projectObjectClass')}>
                    <CodeSelect
                      codeListId="Hankeluokka"
                      value={values.projectObjectClass ?? undefined}
                      onChange={(code) => update('projectObjectClass', code)}
                    />
                  </Field>
                </Box>
                <Box css={twoColumns}>
                  <Field label={tr('sapIdentifier.field.costCenter')}>
                    <MultiSelect<CostCenterOption>
                      options={costCenters.data ?? []}
                      loading={costCenters.isLoading}
                      getOptionId={(costCenter) => costCenter.id}
                      getOptionLabel={(costCenter) => `(${costCenter.id}) ${costCenter.name}`}
                      value={selectedCostCenter}
                      onChange={(costCenter) => update('costCenterId', costCenter?.id ?? null)}
                      multiple={false}
                    />
                  </Field>
                  <Field label={tr('sapIdentifier.field.environmentalCode')}>
                    <CodeSelect
                      codeListId="YmpäristönsuojelunSyy"
                      showIdInLabel
                      value={values.environmentalInvestmentReason ?? undefined}
                      onChange={(code) => update('environmentalInvestmentReason', code)}
                    />
                  </Field>
                </Box>
              </>
            ) : (
              <Box css={twoColumns}>
                <Field label={tr('sapIdentifier.field.owner')}>
                  <UserSelect
                    value={values.responsiblePerson}
                    onChange={(id) => update('responsiblePerson', id ?? '')}
                  />
                </Field>
              </Box>
            )}

            <Box css={twoColumns}>
              <Field label={tr('sapIdentifier.field.startDate')}>
                <DatePicker
                  value={values.startDate}
                  onChange={(date) => update('startDate', date)}
                />
              </Field>
              <Field label={tr('sapIdentifier.field.endDate')}>
                <DatePicker
                  value={isOngoing ? null : values.endDate}
                  readOnly={isOngoing}
                  onChange={(date) => update('endDate', date)}
                />
                {isMaintenance && (
                  <FormControlLabel
                    label={tr('maintenanceProject.ongoing')}
                    control={
                      <Checkbox
                        size="small"
                        checked={isOngoing}
                        onChange={(_, checked) =>
                          update(
                            'endDate',
                            checked
                              ? 'infinity'
                              : defaults.data?.endDate !== 'infinity'
                                ? defaults.data?.endDate ?? null
                                : null,
                          )
                        }
                      />
                    }
                  />
                )}
              </Field>
            </Box>

            {!isProjectObject && (
              <Field label={tr('sapIdentifier.field.serviceClasses')}>
                <Box
                  css={css`
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                  `}
                >
                  {serviceClassCodes.data?.map((code) => (
                    <FormControlLabel
                      key={code.id.id}
                      label={code.text.fi}
                      control={
                        <Checkbox
                          checked={values.serviceClasses.includes(code.id.id)}
                          onChange={(_, checked) =>
                            update(
                              'serviceClasses',
                              checked
                                ? [...values.serviceClasses, code.id.id]
                                : values.serviceClasses.filter((id) => id !== code.id.id),
                            )
                          }
                        />
                      }
                    />
                  ))}
                </Box>
              </Field>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions
        css={css`
          justify-content: space-between;
          padding: 16px 24px;
        `}
      >
        <Button variant="outlined" onClick={onClose} disabled={isSending}>
          {tr('sapIdentifier.dialog.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={send}
          disabled={!isValid || isSending}
          endIcon={isSending ? <CircularProgress size="1rem" /> : undefined}
        >
          {tr('sapIdentifier.dialog.send')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
