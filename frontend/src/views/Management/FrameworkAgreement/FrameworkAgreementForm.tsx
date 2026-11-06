import { zodResolver } from '@hookform/resolvers/zod';
import { SaveSharp, Undo } from '@mui/icons-material';
import { Box, Button, CircularProgress, TextField, css } from '@mui/material';
import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { trpc } from '@frontend/client';
import { FormDatePicker, FormField } from '@frontend/components/forms';
import { SectionTitle } from '@frontend/components/forms/SectionTitle';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { getRequiredFields } from '@frontend/utils/form';

import {
  UpsertFrameworkAgreement,
  upsertFrameworkAgreementSchema,
} from '@shared/schema/frameworkAgreement';

interface Props {
  id?: string;
  onSubmitted?: () => void;
}

export function FrameworkAgreementForm(props: Props) {
  const tr = useTranslations();
  const notify = useNotifications();
  const navigate = useNavigate();

  const frameworkAgreement = trpc.frameworkAgreement.getById.useQuery(
    { id: props.id } as { id: string },
    { enabled: !!props.id },
  );

  const form = useForm<UpsertFrameworkAgreement>({
    mode: 'all',
    resolver: zodResolver(upsertFrameworkAgreementSchema),
    context: {
      requiredFields: getRequiredFields(upsertFrameworkAgreementSchema),
    },
    defaultValues: {
      name: '',
      recordId: '',
      validUntil: null,
    },
  });

  useEffect(() => {
    if (props.id && frameworkAgreement.data) {
      const { id, name, recordId, validUntil } = frameworkAgreement.data;
      form.reset({ id, name, recordId, validUntil });
    }
  }, [frameworkAgreement.data, props.id]);

  const upsert = trpc.frameworkAgreement.upsert.useMutation({
    onSuccess: () => {
      props.onSubmitted?.();
      navigate('/hallinta/puitesopimukset', { replace: true });
      notify({
        severity: 'success',
        title: tr('genericForm.notifySubmitSuccess'),
        duration: 5000,
      });
    },
    onError: () => {
      notify({
        severity: 'error',
        title: tr('genericForm.notifySubmitFailure'),
      });
    },
  });

  const onSubmit = (data: UpsertFrameworkAgreement) => {
    upsert.mutate(data);
  };

  if (props.id && frameworkAgreement.isLoading) {
    return <CircularProgress />;
  }

  return (
    <FormProvider {...form}>
      <SectionTitle title={tr('frameworkAgreement.formTitle')} />
      {props.id && (
        <Box
          css={css`
            display: flex;
            justify-content: flex-end;
          `}
        >
          <Button
            variant="outlined"
            size="small"
            disabled={!form.formState.isDirty}
            color="secondary"
            onClick={() => form.reset()}
            endIcon={<Undo />}
          >
            {tr('genericForm.undoBtnLabel')}
          </Button>
        </Box>
      )}
      <form
        css={css`
          display: grid;
        `}
        onSubmit={form.handleSubmit(onSubmit)}
        autoComplete="off"
      >
        <FormField
          formField="name"
          label={tr('frameworkAgreement.name')}
          component={(field) => <TextField {...field} size="small" autoFocus={true} />}
        />
        <FormField
          formField="recordId"
          label={tr('frameworkAgreement.recordId')}
          component={(field) => <TextField {...field} size="small" />}
        />
        <FormField
          formField="validUntil"
          label={tr('frameworkAgreement.validUntil')}
          helpTooltip={tr('frameworkAgreement.validUntilTooltip')}
          component={(field) => <FormDatePicker field={field} />}
        />
        <Button
          disabled={!form.formState.isValid || upsert.isLoading}
          type="submit"
          sx={{ mt: 2 }}
          variant="contained"
          startIcon={<SaveSharp />}
        >
          {tr('genericForm.save')}
        </Button>
      </form>
    </FormProvider>
  );
}
