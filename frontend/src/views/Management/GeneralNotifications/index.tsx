import { CircularProgress } from '@mui/material';
import { useLocation, useParams } from 'react-router';

import { trpc } from '@frontend/client';

import { GeneralNotificationForm } from './GeneralNotificationForm';
import { GeneralNotificationSearch } from './GeneralNotificationSearch';

export function ManageGeneralNotifications() {
  const location = useLocation();
  const routeParams = useParams() as { tabView: string; contentId: string };

  const notification = trpc.generalNotification.get.useQuery(
    { id: routeParams.contentId },
    {
      enabled: Boolean(routeParams.contentId),
    },
  );

  if (location.pathname.split('/').pop() === 'luo') {
    return <GeneralNotificationForm />;
  }

  if (routeParams.contentId) {
    return notification.isLoading ? (
      <CircularProgress />
    ) : (
      <GeneralNotificationForm
        notification={notification.data}
        onUpsertSuccess={() => notification.refetch()}
      />
    );
  }

  return <GeneralNotificationSearch />;
}
