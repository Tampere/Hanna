import { Box, Button, Drawer, Typography, css } from '@mui/material';
import { useAtom } from 'jotai';
import { useEffect } from 'react';

import { trpc } from '@frontend/client';

import { asyncUserAtom, sessionExpiredAtom } from './stores/auth';
import { useTranslations } from './stores/lang';

const pingIntervalTimeout = 60 * 1000;

export function SessionExpiredWarning() {
  const [sessionExpired, setSessionExpired] = useAtom(sessionExpiredAtom);
  const [, refreshUserValue] = useAtom(asyncUserAtom);
  const sessionCheck = trpc.session.check.useQuery();

  const tr = useTranslations();

  // Set up the polling to catch expired sessions automatically
  useEffect(() => {
    // Set up an interval
    const pingInterval = setInterval(() => {
      sessionCheck.refetch();
    }, pingIntervalTimeout);

    // Clean up: clear the ping interval
    return () => {
      clearInterval(pingInterval);
    };
  }, []);

  function sessionRenewedListener(event: MessageEvent) {
    if (event.data === 'session-renewed') {
      // The opened login window was closed with a successful login -> session is not expired anymore
      window.removeEventListener('message', sessionRenewedListener);
      refreshUserValue();
      setSessionExpired(false);
    }
  }

  return (
    <Drawer
      open={sessionExpired}
      anchor="top"
      ModalProps={{ slotProps: { backdrop: { style: { backdropFilter: 'grayscale(0.8)' } } } }}
    >
      <Box
        css={css`
          display: flex;
          flex-direction: row;
          padding: 10px;
          align-items: center;
          gap: 10px;
        `}
      >
        <Typography>{tr('sessionExpiredWarning.infoText')}</Typography>
        <Button
          variant="contained"
          onClick={() => {
            window.open(`/api/v1/auth/login?redirect=${encodeURIComponent('/session-renewed')}`);
            window.addEventListener('message', sessionRenewedListener);
          }}
        >
          {tr('sessionExpiredWarning.buttonText')}
        </Button>
      </Box>
    </Drawer>
  );
}
