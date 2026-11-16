import { css } from '@emotion/react';
import { Alert, AlertTitle, Box, CircularProgress, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { ReactNode } from 'react';

import { trpc } from '@frontend/client';
import { useTranslations } from '@frontend/stores/lang';

import type { SapIdentifierTarget } from '@shared/schema/sapIdentifierRequest';

interface Props {
  target: SapIdentifierTarget;
  startDate?: string | null;
  /** Kuluseuranta charts, rendered only when the identifier is set and the target has started. */
  children: ReactNode;
  /** Rendered after the charts regardless of status (e.g. the purchase request list). */
  afterContent?: ReactNode;
}

/**
 * Kuluseuranta tab content with SAP identifier status (Figma 6241-4610).
 * The tab is never disabled anymore - missing identifier, pending request and
 * not-yet-started states are shown here instead.
 */
export function SapKuluseurantaStatus({
  target,
  startDate,
  children,
  afterContent,
}: Readonly<Props>) {
  const tr = useTranslations();
  const isProjectObject = Boolean(target.projectObjectId);
  const status = trpc.sapIdentifier.getStatus.useQuery(target);

  if (status.isLoading) {
    return <CircularProgress size="2rem" />;
  }

  const identifier = status.data?.identifier;
  const openRequest = status.data?.openRequest;
  const notStarted = Boolean(startDate) && dayjs(startDate).year() > dayjs().year();
  const showCharts = Boolean(identifier) && !notStarted;

  const alerts = (
    <Box
      css={css`
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 640px;
        margin: 24px auto 0 auto;
      `}
    >
      {notStarted && (
        <Alert severity="info">
          <AlertTitle>
            {tr(
              isProjectObject
                ? 'sapIdentifier.kuluseuranta.notStarted.projectObject'
                : 'sapIdentifier.kuluseuranta.notStarted.project',
            )}
          </AlertTitle>
          {tr('sapIdentifier.kuluseuranta.notStartedInfo')}
        </Alert>
      )}
      {!identifier && openRequest && (
        <Alert severity="info">
          <AlertTitle>
            {tr(
              isProjectObject
                ? 'sapIdentifier.kuluseuranta.pendingTitle.projectObject'
                : 'sapIdentifier.kuluseuranta.pendingTitle.project',
            )}
          </AlertTitle>
          {tr(
            isProjectObject
              ? 'sapIdentifier.kuluseuranta.pendingInfo.projectObject'
              : 'sapIdentifier.kuluseuranta.pendingInfo.project',
            openRequest.requestedBy.name,
            dayjs(openRequest.requestedAt).format('D.M.YYYY'),
          )}
        </Alert>
      )}
      {!identifier && !openRequest && (
        <Alert severity="info">
          {tr(
            isProjectObject
              ? 'sapIdentifier.kuluseuranta.notRequestedInfo.projectObject'
              : 'sapIdentifier.kuluseuranta.notRequestedInfo.project',
          )}
        </Alert>
      )}
    </Box>
  );

  return (
    <Box>
      {!identifier && (
        <Typography
          variant="body2"
          css={css`
            text-align: right;
            color: #525252;
          `}
        >
          {tr('sapIdentifier.kuluseuranta.identifierMissing')}
        </Typography>
      )}
      {showCharts && children}
      {afterContent}
      {!showCharts && alerts}
    </Box>
  );
}
