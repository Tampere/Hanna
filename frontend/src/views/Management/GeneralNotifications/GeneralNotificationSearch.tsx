import { AddCircle } from '@mui/icons-material';
import { Box, Button, Typography, css } from '@mui/material';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router';
import { Link } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { DataTable } from '@frontend/components/DataTable';
import { useTranslations } from '@frontend/stores/lang';

export function GeneralNotificationSearch() {
  const tr = useTranslations();
  const { generalNotification } = trpc.useUtils();
  const navigate = useNavigate();

  function getTextFromNotificationJson(object: object) {
    const textContent: string[] = [];

    function getText(object: object, textContent: string[]) {
      if ('text' in object && typeof object.text === 'string') {
        textContent.push(object.text);
        return;
      }
      if ('content' in object) {
        if (Array.isArray(object.content)) {
          object.content.forEach((content) => {
            if (typeof content === 'object') {
              getText(content, textContent);
            }
          });
        }
      }
    }
    getText(object, textContent);
    return textContent.join(' ');
  }

  async function getRows(params: any) {
    // TODO params should be typed if search filters are implemented
    const searchResult = await generalNotification.search.fetch(params);

    const formattedResults = searchResult.map((notification) => ({
      ...notification,
      message: getTextFromNotificationJson(notification.message),
    }));

    return formattedResults;
  }

  return (
    <Box
      css={css`
        display: flex;
        flex-direction: column;
        & .message {
          max-width: 400px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}
    >
      <Box
        css={css`
          display: flex;
          align-items: center;
        `}
      >
        <Typography variant="h4" component="h1" m={2}>
          {tr('management.tabs.generalNotifications')}
        </Typography>
        <Button
          css={css`
            margin-left: auto;
            height: fit-content;
          `}
          component={Link}
          to={`/hallinta/tiedotteet/luo`}
          variant="contained"
          color="primary"
          size="small"
          endIcon={<AddCircle />}
        >
          {tr('generalNotifications.addNotification')}
        </Button>
      </Box>

      <DataTable
        disableSorting
        getRows={getRows}
        getRowCount={async (params) => {
          const rows = await generalNotification.getSearchCount.fetch(params);
          return { rowCount: rows?.count ?? 0 };
        }}
        onRowClick={(row) => {
          navigate(`/hallinta/tiedotteet/${row.id}`);
        }}
        rowsPerPageOptions={[5, 10, 20]}
        filters={{ filters: null }}
        columns={{
          createdAt: {
            title: tr('generalNotifications.dateColumnTitle'),
            collapsible: false,
            format: (date) => dayjs(date).format('D.M.YYYY'),
          },
          title: {
            title: tr('generalNotifications.titleColumnTitle'),
            collapsible: false,
          },
          message: {
            title: tr('generalNotifications.messageColumnTitle'),
            collapsible: false,
          },
          publisher: {
            title: tr('generalNotifications.publisherColumnTitle'),
            collapsible: false,
          },
        }}
      />
    </Box>
  );
}
