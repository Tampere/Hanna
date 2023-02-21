import { zodResolver } from '@hookform/resolvers/zod';
import { SaveSharp, Undo } from '@mui/icons-material';
import { Autocomplete, Box, Button, CircularProgress, TextField, css } from '@mui/material';
import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { trpc } from '@frontend/client';
import { FormField } from '@frontend/components/forms';
import { SectionTitle } from '@frontend/components/forms/SectionTitle';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { getRequiredFields } from '@frontend/utils/form';

import { Contractor, contractorSchema } from '@shared/schema/contractor';

interface Props {
  contractorId?: string;
  onSubmitted?: () => void;
}

export function ContractorForm(props: Props) {
  const tr = useTranslations();
  const notify = useNotifications();
  const navigate = useNavigate();

  const contractor = trpc.contractor.getContractorById.useQuery(
    { id: props.contractorId } as { id: string },
    {
      enabled: !!props.contractorId,
    }
  );

  const companies = trpc.contractor.getCompanies.useQuery();

  useEffect(() => {
    if (props.contractorId && contractor.data) {
      form.reset(contractor.data);
    }
  }, [contractor.data, props.contractorId]);

  const form = useForm<Contractor>({
    mode: 'all',
    resolver: zodResolver(contractorSchema),
    context: {
      requiredFields: getRequiredFields(contractorSchema),
    },
    defaultValues: contractor.data ?? {
      contactName: '',
      phoneNumber: '',
      emailAddress: '',
      businessId: '',
    },
  });

  const contractorUpsert = trpc.contractor.upsertContractor.useMutation({
    onSuccess: () => {
      props.onSubmitted?.();
      navigate('/hallinta/urakoitsijat', { replace: true });
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

  const onSubmit = (data: Contractor) => {
    contractorUpsert.mutate(data);
  };

  if (props.contractorId && contractor.isLoading) {
    return <CircularProgress />;
  }

  return (
    <FormProvider {...form}>
      <SectionTitle title={tr('contractorForm.title')} />
      {props.contractorId && (
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
          formField="contactName"
          label={tr('contractor.name')}
          component={(field) => <TextField {...field} size="small" autoFocus={true} />}
        />
        <FormField
          formField="phoneNumber"
          label={tr('contractor.phone')}
          component={(field) => <TextField {...field} size="small" />}
        />
        <FormField
          formField="emailAddress"
          label={tr('contractor.email')}
          component={({ ref, ...field }) => <TextField {...field} size="small" />}
        />
        <FormField
          formField="businessId"
          component={(field) => (
            <Autocomplete
              {...field}
              autoHighlight
              blurOnSelect={true}
              onChange={(_, item) => {
                field.onChange(item);
              }}
              getOptionLabel={(option) => {
                return companies.data?.find((c) => c.businessId === option)?.companyName ?? '';
              }}
              options={companies.data ? companies.data.map((c) => c.businessId) : []}
              renderInput={(params) => {
                return <TextField {...params} size="small" />;
              }}
            />
          )}
          label={tr('company.name')}
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
