import { Alert, Box, CircularProgress, Typography } from '@mui/material';

import { trpc } from '@frontend/client';
import { useTranslations } from '@frontend/stores/lang';

import { GeneralNotificationList } from './GeneralNotificationList';

export function GeneralNotifications() {
  const generalNotifications = trpc.generalNotification.getAll.useQuery();
  const tr = useTranslations();

  return (
    <Box mt={2}>
      <Typography component="h1" variant="h4">
        {tr('pages.generalNotificationTitle')}
      </Typography>
      {generalNotifications.isLoading ? (
        <CircularProgress />
      ) : generalNotifications.isError ? (
        <Alert severity="error">{tr('generalNotifications.error')}</Alert>
      ) : (
        <GeneralNotificationList notifications={generalNotifications.data} />
      )}
    </Box>
  );
}
