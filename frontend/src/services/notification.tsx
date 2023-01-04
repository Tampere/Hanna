import { css } from '@emotion/react';
import { Close } from '@mui/icons-material';
import { Alert, AlertTitle, Box, IconButton, Stack } from '@mui/material';
import { atom, useAtom, useSetAtom } from 'jotai';

const notificationContainerStyle = css`
  z-index: 500;
  position: fixed;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
`;

const wrapperStyle = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  justify-content: center;
  align-items: center;
`;

const alertStyle = css`
  margin-bottom: 8px;
  width: 392px;
  :hover {
    opacity: 0.9;
  }
`;

interface Notification {
  id?: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message?: string;
  duration?: number;
}

const notificationsAtom = atom<Notification[]>([]);

export function useNotifications() {
  const setAtom = useSetAtom(notificationsAtom);
  return function notify(notification: Notification) {
    const id = Math.random().toString(36).substring(7);
    const newNotification = { ...notification, id };
    setAtom((notifications) => [...notifications, newNotification]);

    if (notification.duration) {
      setTimeout(() => {
        setAtom((notifications) => notifications.filter((n) => n.id !== id));
      }, notification.duration);
    }
  };
}

export default function NotificationList() {
  const [notifications, setNotifications] = useAtom(notificationsAtom);

  return (
    <Stack css={notificationContainerStyle} spacing={2}>
      <Box css={wrapperStyle}>
        {notifications.map((notification: Notification) => (
          <Alert
            key={notification.id}
            css={alertStyle}
            severity={notification.severity}
            action={
              <IconButton
                size="small"
                onClick={() => setNotifications((ns) => ns.filter((n) => n.id !== notification.id))}
              >
                <Close />
              </IconButton>
            }
          >
            <AlertTitle>{notification.title}</AlertTitle>
            {notification.message}
          </Alert>
        ))}
      </Box>
    </Stack>
  );
}
