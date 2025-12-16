import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

import { useTranslations } from '@frontend/stores/lang';
import { blockerStatusAtom } from '@frontend/stores/navigationBlocker';

import { ConfirmDialog } from './dialogs/ConfirmDialog';

const splitViewForms = ['investmentForm', 'maintenanceForm', 'projectObjectForm'];

export function NavigationBlocker() {
  const tr = useTranslations();

  const [status, setStatus] = useAtom(blockerStatusAtom);

  function beforeUnloadHandler(event: BeforeUnloadEvent) {
    event.preventDefault();
  }

  useEffect(() => {
    if (status.updating) {
      setStatus((prev) => ({ ...prev, updating: false }));
    }
    if (status.dirtyComponents.length > 0) {
      window.addEventListener('beforeunload', beforeUnloadHandler);
    } else {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
    }

    return () => {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
    };
  }, [status.dirtyComponents]);

  // Note: useBlocker is a singleton so use of multiple NavigationBlockers in the same view is not possible (https://github.com/remix-run/react-router/discussions/9978)
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (
      // User is in split view and has modified left side form and wants to navigate between tabs
      currentLocation.pathname === nextLocation.pathname &&
      status.dirtyComponents.every((component) => splitViewForms.includes(component))
    ) {
      return false;
    }

    return (
      status.dirtyComponents.length > 0 &&
      (currentLocation.pathname !== nextLocation.pathname ||
        // Block navigation between modified unsaved tabs
        (status.currentComponent !== null && currentLocation.search !== nextLocation.search))
    );
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
