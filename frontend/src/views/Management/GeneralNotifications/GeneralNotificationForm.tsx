import { zodResolver } from '@hookform/resolvers/zod';
import { Box, TextField, Typography, css } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { trpc } from '@frontend/client';
import { FormField } from '@frontend/components/forms';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { useNavigationBlocker } from '@frontend/stores/navigationBlocker';
import { getRequiredFields } from '@frontend/utils/form';

import {
  GeneralNotification,
  UpsertGeneralNotification,
  upsertGeneralNotificationSchema,
} from '@shared/schema/generalNotification';

import { FormFunctionButtons } from './FormFunctionButtons';
import { GeneralNotificationTextEditor } from './GeneralNotificationTextEditor';

interface Props {
  notification?: GeneralNotification | null;
  onUpsertSuccess?: () => void;
}

export function GeneralNotificationForm({ notification, onUpsertSuccess }: Props) {
  const tr = useTranslations();
  const navigate = useNavigate();
  const notify = useNotifications();
  const queryClient = useQueryClient();

  const generalNotificationDelete = trpc.generalNotification.delete.useMutation({
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['generalNotification', 'getAll'] });
      notify({
        severity: 'success',
        title: tr('generalNotificationForm.notifyDelete'),
        duration: 5000,
      });
      navigate('/hallinta/tiedotteet');
    },
    onError: () => {
      notify({
        severity: 'error',
        title: tr('generalNotificationForm.notifyDeleteFailed'),
        duration: 5000,
      });
    },
  });

  const generalNotificationUpsert = trpc.generalNotification.upsert.useMutation({
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['generalNotification', 'getAll'] });
      if (!notification) {
        navigate('/hallinta/tiedotteet');
      } else {
        onUpsertSuccess?.();
        form.reset({ id: data.id, title: data.title, message: data.message });
      }

      notify({
        severity: 'success',
        title: tr('generalNotificationForm.notifyUpsert'),
        duration: 5000,
      });
    },
    onError: () => {
      notify({
        severity: 'error',
        title: tr('generalNotificationForm.notifyUpsertFailed'),
        duration: 5000,
      });
    },
  });

  const formDefaultValues = useMemo<Partial<UpsertGeneralNotification>>(
    () => ({
      id: null,
      title: '',
      message: undefined,
    }),
    [],
  );

  const form = useForm<UpsertGeneralNotification>({
    mode: 'all',
    resolver: zodResolver(upsertGeneralNotificationSchema),
    context: {
      requiredFields: getRequiredFields(upsertGeneralNotificationSchema),
    },
    defaultValues: notification
      ? {
          id: notification.id,
          title: notification.title,
          message: notification.message,
        }
      : formDefaultValues,
  });
  form.watch('message');

  useEffect(() => {
    form.reset(notification ?? formDefaultValues);
  }, [notification]);

  useEffect(() => {
    if (form.formState.isSubmitSuccessful && !notification) {
      form.reset();
    }
  }, [form.formState.isSubmitSuccessful, notification]);

  const { isDirty } = form.formState;
  useNavigationBlocker(isDirty, 'generalNotifications');

  const onSubmit = async (data: UpsertGeneralNotification) => {
    generalNotificationUpsert.mutate(data);
  };

  return (
    <Box
      css={css`
        max-width: 1400px;
        display: flex;
        flex-direction: column;
        align-items: center;
      `}
    >
      <Box
        css={css`
          display: flex;
          align-items: center;
          align-self: stretch;
        `}
      >
        <Typography variant="h4" component="h1" m={2}>
          <span
            css={css`
              color: #525252;
            `}
          >
            {tr('generalNotificationForm.title')}:&nbsp;
          </span>
          {form.watch('title')}
        </Typography>
      </Box>
      <FormProvider {...form}>
        <form
          css={css`
            display: flex;
            width: 70%;
            flex-direction: column;
          `}
          onSubmit={form.handleSubmit(onSubmit)}
          autoComplete="off"
        >
          <FormField
            formField="title"
            label={tr('generalNotificationForm.headerFieldLabel')}
            errorTooltip={tr('generalNotificationForm.headerFieldTooltip')}
            component={(field) => <TextField {...field} size="small" autoFocus />}
          />
          <FormField
            formField={'message'}
            label={tr('generalNotificationForm.messageEditorFieldLabel')}
            errorTooltip={tr('generalNotificationForm.messageEditorFieldTooltip')}
            component={({ value, onChange }) => (
              <GeneralNotificationTextEditor
                value={value}
                onChange={(value) => {
                  onChange(value);
                }}
              />
            )}
          />
          <FormFunctionButtons
            isPublished={!!notification}
            dirty={form.formState.isDirty}
            disableDelete={!notification}
            onDelete={() => {
              const id = form.getValues().id;
              if (id) generalNotificationDelete.mutate({ id: id });
            }}
            onSave={() => {
              form.handleSubmit(onSubmit)();
            }}
            onCancel={() => navigate('/hallinta/tiedotteet')}
          />
          <Box
            css={css`
              margin-left: auto;
            `}
          >
            {notification ? (
              <Typography>
                {tr(
                  'generalNotificationForm.notificationPublished',
                  dayjs(notification.createdAt).format(`D.M.YYYY [${tr('atTime')}] HH:mm`),
                )}
              </Typography>
            ) : (
              <Typography>{tr('generalNotificationForm.notificationNotPublished')}</Typography>
            )}
          </Box>
        </form>
      </FormProvider>
    </Box>
  );
}
