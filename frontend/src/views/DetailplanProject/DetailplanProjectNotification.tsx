import { Send } from '@mui/icons-material';
import {
  Autocomplete,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { useEffect, useState } from 'react';

import { trpc } from '@frontend/client';
import { AsyncJobButton } from '@frontend/components/AsyncJobButton';
import { MailPreview } from '@frontend/components/MailPreview';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';

import {
  DetailplanNotificationTemplate,
  detailplanNotificationTemplates,
} from '@shared/schema/project/detailplan';

import { NotificationHistory } from './NotificationHistory';

interface Props {
  projectId: string;
  enabled: boolean;
}

export function DetailplanProjectNotification({ projectId, enabled }: Readonly<Props>) {
  const tr = useTranslations();
  const notify = useNotifications();

  const [template, setTemplate] =
    useState<DetailplanNotificationTemplate>('new-detailplan-project');

  const { data: history, refetch: refetchHistory } =
    trpc.detailplanProject.getNotificationHistory.useQuery({ projectId });

  const { data: preview, isLoading } = trpc.detailplanProject.previewNotificationMail.useQuery(
    {
      projectId,
      template,
    },
    {
      queryKey: ['detailplanProject.previewNotificationMail', { projectId, template }],
    }
  );
  const { data: defaultRecipients, isLoading: defaultRecipientsLoading } =
    trpc.detailplanProject.getNotificationRecipients.useQuery();

  const [recipients, setRecipients] = useState<string[]>([]);
  const [recipientInputValue, setRecipientInputValue] = useState('');
  const sendNotificationMail = trpc.detailplanProject.sendNotificationMail.useMutation();

  // Set default recipients once after they're loaded
  useEffect(() => {
    if (!defaultRecipients) {
      return;
    }
    setRecipients(defaultRecipients);
  }, [defaultRecipients]);

  // Update the selected template according to notification history
  useEffect(() => {
    if (history && history.length > 0) {
      setTemplate('update-detailplan-project');
    }
  }, [history]);

  return isLoading || !preview ? null : (
    <>
      <Box>
        <FormControl sx={{ mb: 2 }}>
          <InputLabel id="notification-template-label" sx={{ background: '#fff' }}>
            {tr('detailplanProject.notificationTemplate')}
          </InputLabel>
          <Select
            labelId="notification-template-label"
            value={template}
            onChange={(event) => {
              setTemplate(event.target.value as DetailplanNotificationTemplate);
            }}
          >
            {detailplanNotificationTemplates.map((template) => (
              <MenuItem key={template} value={template}>
                {tr(`detailplanProject.notificationTemplate.${template}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <MailPreview subject={preview.subject ?? ''} html={preview.html ?? ''} />
        <Autocomplete
          sx={{ mt: 4 }}
          loading={defaultRecipientsLoading}
          disabled={!enabled || defaultRecipientsLoading}
          multiple
          freeSolo
          value={recipients}
          inputValue={recipientInputValue}
          options={defaultRecipients ?? []}
          renderInput={(params) => (
            <TextField {...params} label={tr('detailplanProject.recipients')} />
          )}
          onChange={(_, value) => {
            setRecipients(value);
          }}
          onInputChange={(_, value) => {
            setRecipientInputValue(value);
          }}
          onBlur={() => {
            // If there is an "incomplete" input value, add it to the recipients list on blur.
            if (recipientInputValue.length > 0) {
              setRecipients([...recipients, recipientInputValue]);
              setRecipientInputValue('');
            }
          }}
        />
        <AsyncJobButton
          variant="contained"
          sx={{ mt: 4 }}
          disabled={!enabled || !recipients.length}
          endIcon={<Send />}
          onStart={async () => {
            return sendNotificationMail.mutateAsync({ projectId, template, recipients });
          }}
          onError={() => {
            notify({
              title: tr('detailplanProject.notifySendNotificationFailed'),
              severity: 'error',
            });
          }}
          onFinished={() => {
            notify({
              title: tr('detailplanProject.notifySendNotification'),
              severity: 'success',
              duration: 5000,
            });
            refetchHistory();
          }}
        >
          {tr('detailplanProject.sendNotification')}
        </AsyncJobButton>
        {history && <NotificationHistory events={history} />}
      </Box>
    </>
  );
}
