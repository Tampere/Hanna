import { zodResolver } from '@hookform/resolvers/zod';
import { SaveSharp, Undo } from '@mui/icons-material';
import { Box, Button, CircularProgress, TextField, css } from '@mui/material';
import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { trpc } from '@frontend/client';
import { FormField } from '@frontend/components/forms';
import { SectionTitle } from '@frontend/components/forms/SectionTitle';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { getRequiredFields } from '@frontend/utils/form';

import { Company, companySchema } from '@shared/schema/contractor';

interface Props {
  businessId?: string;
  onSubmitted?: () => void;
}

export function CompanyForm(props: Props) {
  const tr = useTranslations();
  const notify = useNotifications();
  const navigate = useNavigate();

  const company = trpc.contractor.getCompanyById.useQuery(
    { businessId: props.businessId } as { businessId: string },
    { enabled: !!props.businessId }
  );

  useEffect(() => {
    if (props.businessId && company.data) {
      form.reset(company.data);
    }
  }, [company.data, props.businessId]);

  const form = useForm<Company>({
    mode: 'all',
    resolver: zodResolver(companySchema),
    context: {
      requiredFields: getRequiredFields(companySchema),
    },
    defaultValues: company.data ?? {
      companyName: '',
      businessId: '',
    },
  });

  const companyUpsert = trpc.contractor.upsertCompany.useMutation({
    onSuccess: (data) => {
      props.onSubmitted?.();
      navigate('/hallinta/yritykset', { replace: true });
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

  const onSubmit = (data: Company) => {
    companyUpsert.mutate(data);
  };

  if (props.businessId && company.isLoading) {
    return <CircularProgress />;
  }

  return (
    <FormProvider {...form}>
      <SectionTitle title={tr('companyForm.title')} />
      {props.businessId && (
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
          formField="businessId"
          label={tr('company.businessId')}
          component={(field) => <TextField {...field} size="small" autoFocus={true} />}
        />
        <FormField
          formField="companyName"
          label={tr('company.name')}
          component={(field) => <TextField {...field} size="small" />}
        />
        <Button
          disabled={!form.formState.isValid}
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
