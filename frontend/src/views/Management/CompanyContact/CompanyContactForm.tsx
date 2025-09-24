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

import { CompanyContact, companyContactSchema } from '@shared/schema/company';

interface Props {
  contactId?: string;
  onSubmitted?: () => void;
}

export function CompanyContactForm(props: Props) {
  const tr = useTranslations();
  const notify = useNotifications();
  const navigate = useNavigate();

  const contact = trpc.company.getContactById.useQuery({ id: props.contactId } as { id: string }, {
    enabled: !!props.contactId,
  });

  const companies = trpc.company.getAll.useQuery();

  useEffect(() => {
    if (props.contactId && contact.data) {
      form.reset(contact.data);
    }
  }, [contact.data, props.contactId]);

  const form = useForm<CompanyContact>({
    mode: 'all',
    resolver: zodResolver(companyContactSchema),
    context: {
      requiredFields: getRequiredFields(companyContactSchema),
    },
    defaultValues: contact.data ?? {
      contactName: '',
      phoneNumber: '',
      emailAddress: '',
      companyId: '',
    },
  });

  const contactUpsert = trpc.company.upsertContact.useMutation({
    onSuccess: () => {
      props.onSubmitted?.();
      navigate('/hallinta/yritysten-yhteyshenkilot', { replace: true });
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

  const onSubmit = (data: CompanyContact) => {
    contactUpsert.mutate(data);
  };

  if (props.contactId && contact.isLoading) {
    return <CircularProgress />;
  }

  return (
    <FormProvider {...form}>
      <SectionTitle title={tr('companyContactForm.title')} />
      {props.contactId && (
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
          label={tr('companyContact.name')}
          component={(field) => <TextField {...field} size="small" autoFocus={true} />}
        />
        <FormField
          formField="phoneNumber"
          label={tr('companyContact.phone')}
          component={(field) => <TextField {...field} size="small" />}
        />
        <FormField
          formField="emailAddress"
          label={tr('companyContact.email')}
          component={({ ref, ...field }) => <TextField {...field} size="small" />}
        />
        <FormField
          formField="companyId"
          component={(field) => (
            <Autocomplete
              {...field}
              autoHighlight
              blurOnSelect={true}
              onChange={(_, item) => {
                field.onChange(item);
              }}
              getOptionLabel={(option) => {
                return companies.data?.find((c) => c.id === option)?.companyName ?? '';
              }}
              options={companies.data ? companies.data.map((c) => c.id) : []}
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
