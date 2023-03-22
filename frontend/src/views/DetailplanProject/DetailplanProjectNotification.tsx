import { Send } from '@mui/icons-material';
import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import { trpc } from '@frontend/client';
import { AsyncJobButton } from '@frontend/components/AsyncJobButton';
import { MailPreview } from '@frontend/components/MailPreview';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';

interface Props {
  projectId: string;
}

export function DetailplanProjectNotification({ projectId }: Props) {
  const tr = useTranslations();
  const notify = useNotifications();

  const { data: preview, isLoading } = trpc.detailplanProject.previewNotificationMail.useQuery(
    {
      id: projectId,
    },
    {
      queryKey: ['detailplanProject.previewNotificationMail', { id: projectId }],
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

  return isLoading || !preview ? null : (
    <>
      <Box>
        <Typography sx={{ mb: 4 }}>{tr('detailplanProject.notificationPreview')}</Typography>
        <MailPreview subject={preview.subject ?? ''} html={preview.html ?? ''} />
        <Autocomplete
          sx={{ mt: 4 }}
          loading={defaultRecipientsLoading}
          disabled={defaultRecipientsLoading}
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
          endIcon={<Send />}
          onStart={async () => {
            return sendNotificationMail.mutateAsync({ id: projectId, recipients });
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
          }}
        >
          {tr('detailplanProject.sendNotification')}
        </AsyncJobButton>
      </Box>
    </>
  );
}
