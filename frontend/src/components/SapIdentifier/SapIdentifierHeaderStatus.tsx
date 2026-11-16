import { css } from '@emotion/react';
import { EuroSymbol } from '@mui/icons-material';
import { Box, Button, Tooltip, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useState } from 'react';

import { trpc } from '@frontend/client';
import { useTranslations } from '@frontend/stores/lang';

import type { SapIdentifierTarget } from '@shared/schema/sapIdentifierRequest';

import { SapIdentifierRequestDialog } from './SapIdentifierRequestDialog';

/** "tänään", "eilen" or "N päivää sitten" */
export function useDaysAgo() {
  const tr = useTranslations();
  return (date: Date) => {
    const days = dayjs().startOf('day').diff(dayjs(date).startOf('day'), 'day');
    if (days <= 0) return tr('sapIdentifier.daysAgo.today');
    if (days === 1) return tr('sapIdentifier.daysAgo.yesterday');
    return tr('sapIdentifier.daysAgo.many', days);
  };
}

interface Props {
  target: SapIdentifierTarget;
  /** Owner or write permission - only they can send a request. */
  canRequest: boolean;
}

/**
 * Header element of a hanke / kohde (Figma 6241-4610):
 * - no identifier and no request: button to request one (users who can edit)
 * - open request: "ilmoitettu talousjärjestelmään N päivää sitten"
 * - identifier set: nothing
 */
export function SapIdentifierHeaderStatus({ target, canRequest }: Readonly<Props>) {
  const tr = useTranslations();
  const daysAgo = useDaysAgo();
  const [dialogOpen, setDialogOpen] = useState(false);
  const isProjectObject = Boolean(target.projectObjectId);

  const status = trpc.sapIdentifier.getStatus.useQuery(target);

  if (!status.data || status.data.identifier) {
    return null;
  }

  if (status.data.openRequest) {
    return (
      <Typography
        variant="body2"
        css={css`
          white-space: nowrap;
          color: #525252;
        `}
      >
        {tr(
          isProjectObject ? 'sapIdentifier.pending.projectObject' : 'sapIdentifier.pending.project',
          daysAgo(status.data.openRequest.requestedAt),
        )}
      </Typography>
    );
  }

  if (!canRequest) {
    return null;
  }

  const parentMissing = isProjectObject && !status.data.parentProjectSapId;

  return (
    <>
      <Tooltip title={parentMissing ? tr('sapIdentifier.requestButton.parentMissing') : ''}>
        {/* span keeps the tooltip working on a disabled button */}
        <Box component="span">
          <Button
            size="small"
            variant="outlined"
            disabled={parentMissing}
            endIcon={<EuroSymbol />}
            onClick={() => setDialogOpen(true)}
            css={css`
              white-space: nowrap;
            `}
          >
            {tr(
              isProjectObject
                ? 'sapIdentifier.requestButton.projectObject'
                : 'sapIdentifier.requestButton.project',
            )}
          </Button>
        </Box>
      </Tooltip>
      <SapIdentifierRequestDialog
        open={dialogOpen}
        target={target}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}
