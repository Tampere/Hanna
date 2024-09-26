import { css } from '@emotion/react';
import { Close } from '@mui/icons-material';
import { Alert, AlertTitle, Box, IconButton, Stack } from '@mui/material';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';

const notificationContainerStyle = css`
  z-index: 2000;
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

const alertStyle = (isVisible: boolean) => css`
  opacity: ${isVisible ? 1 : 0};
  transform: translateY(${isVisible ? 0 : -100}%);
  transition: 0.2s ease-in-out;
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
  transitionTime?: number;
}

const notificationsAtom = atom<Notification[]>([]);

function NotificationAlert({ notification }: { notification: Notification }) {
  const setNotifications = useSetAtom(notificationsAtom);
  const [isVisible, setIsVisible] = useState(false);
  const visibleDuration =
    notification.duration && notification.transitionTime
      ? notification.duration - notification.transitionTime
      : null;

  useEffect(() => {
    setTimeout(() => {
      setIsVisible(true);
    }, 0);

    if (visibleDuration) {
      setTimeout(
        () => {
          setIsVisible(false);
        },
        Math.max(visibleDuration, 0),
      );
    }
  }, []);

  return (
    <Alert
      css={alertStyle(isVisible)}
      severity={notification.severity}
      action={
        <IconButton
          size="small"
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => {
              setNotifications((ns) => ns.filter((n) => n.id !== notification.id));
            }, 200);
          }}
        >
          <Close />
        </IconButton>
      }
    >
      <AlertTitle>{notification.title}</AlertTitle>
      {notification.message}
    </Alert>
  );
}

export function useNotifications() {
  const setNotifications = useSetAtom(notificationsAtom);
  return function notify(notification: Notification) {
    const id = Math.random().toString(36).substring(7);
    const newNotification = {
      ...notification,
      id,
      transitionTime: notification.transitionTime ?? 500,
    };

    setNotifications((notifications) => {
      // Don't stack notifications with the same title
      const newIndex = notifications.findIndex((n) => n.title === newNotification.title);
      if (newIndex !== -1) {
        return notifications.toSpliced(newIndex, 1, newNotification);
      }
      return [...notifications, newNotification];
    });

    if (notification.duration) {
      setTimeout(() => {
        setNotifications((notifications) => notifications.filter((n) => n.id !== id));
      }, notification.duration);
    }
  };
}

export default function NotificationList() {
  const notifications = useAtomValue(notificationsAtom);
  return (
    <Stack css={notificationContainerStyle} spacing={2}>
      <Box css={wrapperStyle}>
        {notifications.map((notification: Notification) => (
          <NotificationAlert key={notification.id} notification={notification} />
        ))}
      </Box>
    </Stack>
  );
}
