import { CampaignTwoTone, ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Theme,
  Typography,
  css,
} from '@mui/material';
import Image from '@tiptap/extension-image';
import { generateHTML } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import dayjs from 'dayjs';
import { useState } from 'react';

import { useTranslations } from '@frontend/stores/lang';

import { GeneralNotification } from '@shared/schema/generalNotification';

import { GeneralNotificationCard } from './GeneralNotificationCard';

interface Props {
  notifications: readonly GeneralNotification[];
}

const notificationListStyle = (theme: Theme) => css`
  margin-bottom: ${theme.spacing(1)};
  --tiptap-padding: 8px;
  --collapse-icon-width: 24px;
  --collapse-icon-padding-left: 4px;
  --header-item-gap: 6px;
  --text-content-padding-left: calc(
    var(--header-item-gap) + var(--collapse-icon-width) + var(--collapse-icon-padding-left) - var(
        --tiptap-padding
      )
  );

  & .MuiAccordion-root {
    box-shadow: none;
    border: 0.5px solid #c4c4c4;
    border-left: 4px solid ${theme.palette.primary.main};
  }

  & .MuiAccordionSummary-root {
    padding-left: var(--collapse-icon-padding-left);
    flex-direction: row-reverse;
    gap: var(--header-item-gap);
  }

  & .MuiAccordionSummary-expandIconWrapper {
    color: #c4c4c4;
    transform: rotate(-90deg);
    &.Mui-expanded {
      transform: rotate(0deg);
    }
  }
  & .MuiAccordionDetails-root {
    padding: 0 1rem 0 var(--text-content-padding-left);
  }
`;

function GeneralNotificationAccordion({ notification }: { notification: GeneralNotification }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Accordion
      disableGutters
      expanded={expanded}
      onChange={(_event, expanded) => setExpanded(expanded)}
    >
      <AccordionSummary
        css={css`
          margin-left: 0;
        `}
        expandIcon={<ExpandMore />}
      >
        <Box display="flex" flex={1} justifyContent="space-between" alignItems="center">
          <Typography variant="h5" component="h1" color="primary">
            {notification.title}
          </Typography>
          <Typography color={'#c4c4c4'} fontSize={'14px'}>
            {notification.publisher}, {dayjs(notification.createdAt).format('D.M.YYYY')}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {expanded && (
          <GeneralNotificationCard
            content={generateHTML(notification.message, [StarterKit, Image])}
          />
        )}
      </AccordionDetails>
    </Accordion>
  );
}

export function GeneralNotificationList({ notifications }: Props) {
  const tr = useTranslations();

  if (notifications.length === 0) {
    return (
      <Box
        css={css`
          height: 200px;
          margin: auto;
          display: flex;
          gap: 0.5rem;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        `}
      >
        <CampaignTwoTone
          css={css`
            height: 70px;
            width: 70px;
          `}
        />
        <Typography variant="h6" component="p">
          {tr('generalNotifications.noResults')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      css={css`
        min-width: 65%;
        max-width: 800px;
        overflow: auto;
        margin: 40px auto;
      `}
    >
      {notifications.map((notification) => (
        <article key={notification.id} css={notificationListStyle}>
          <GeneralNotificationAccordion notification={notification} />
        </article>
      ))}
    </Box>
  );
}
