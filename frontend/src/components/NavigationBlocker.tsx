import { useBlocker } from 'react-router-dom';

import { useTranslations } from '@frontend/stores/lang';

import { ConfirmDialog } from './dialogs/ConfirmDialog';

interface Props {
  condition: boolean;
}

export function NavigationBlocker({ condition }: Props) {
  const tr = useTranslations();

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    return condition && currentLocation.pathname !== nextLocation.pathname;
  });

  return (
    <ConfirmDialog
      isOpen={blocker.state === 'blocked'}
      title={tr('genericTabNavigationDialog.title')}
      content={tr('genericTabNavigationDialog.content')}
      cancelButtonLabel={tr('cancel')}
      confirmButtonLabel={tr('continue')}
      onCancel={() => {
        blocker.reset?.();
      }}
      onConfirm={() => {
        blocker.proceed?.();
      }}
    />
  );
}
