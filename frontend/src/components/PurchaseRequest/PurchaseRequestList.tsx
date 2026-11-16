import { css } from '@emotion/react';
import { Add, ChevronRight } from '@mui/icons-material';
import { Box, Button, CircularProgress, Paper, Typography } from '@mui/material';
import { useState } from 'react';

import { trpc } from '@frontend/client';
import { formatCurrency } from '@frontend/components/forms/CurrencyInput';
import { useTranslations } from '@frontend/stores/lang';

import { PurchaseRequest, sumPhasePrices } from '@shared/schema/purchaseRequest';

import { PurchaseRequestDialog } from './PurchaseRequestDialog';

interface Props {
  projectObjectId: string;
  /** Purchase requests need a WBS - nothing is shown without one. */
  sapWbsId?: string | null;
  isMaintenance: boolean;
  canEdit: boolean;
}

function price(request: PurchaseRequest) {
  if (request.isContractPrice && request.contractPrice != null) {
    return request.contractPrice;
  }
  return request.phasePrices.length > 0 ? sumPhasePrices(request.phasePrices) : null;
}

/** Purchase requests of a kohde, shown after the Kuluseuranta charts. */
export function PurchaseRequestList({
  projectObjectId,
  sapWbsId,
  isMaintenance,
  canEdit,
}: Readonly<Props>) {
  const tr = useTranslations();
  const list = trpc.purchaseRequest.list.useQuery(
    { projectObjectId },
    { enabled: Boolean(sapWbsId) },
  );
  // undefined = closed, null = new request
  const [openId, setOpenId] = useState<string | null | undefined>(undefined);

  if (!sapWbsId) return null;

  return (
    <Box
      css={css`
        max-width: 960px;
        margin: 24px auto 0 auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
      `}
    >
      <Typography
        css={css`
          font-size: 1.25rem;
          font-weight: 600;
          color: #22437b;
        `}
      >
        {tr('purchaseRequest.list.title')}
      </Typography>

      {list.isLoading && <CircularProgress size="1.5rem" />}
      {list.data?.length === 0 && (
        <Typography variant="body2">{tr('purchaseRequest.list.empty')}</Typography>
      )}
      {list.data?.map((request, index) => {
        const amount = price(request);
        return (
          <Paper
            key={request.id}
            variant="outlined"
            component="button"
            onClick={() => setOpenId(request.id)}
            css={css`
              display: flex;
              align-items: center;
              gap: 16px;
              padding: 8px 16px;
              text-align: left;
              cursor: pointer;
              font: inherit;
              background: white;
              &:hover {
                background: #f0f4fa;
              }
            `}
          >
            <Box
              css={css`
                flex: 1;
              `}
            >
              <Typography variant="body1">
                <strong>{tr('purchaseRequest.list.item', index + 1)}:</strong>{' '}
                {[
                  request.companyName,
                  `(${request.costCenterId}) ${request.costCenterName}`,
                  request.frameworkAgreementName,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {request.purchaseOrderNumber
                  ? tr('purchaseRequest.list.orderNumber', request.purchaseOrderNumber)
                  : tr('purchaseRequest.list.orderNumberMissing')}
              </Typography>
            </Box>
            {amount != null && <Typography variant="body1">{formatCurrency(amount)}</Typography>}
            <ChevronRight />
          </Paper>
        );
      })}

      {canEdit && (
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={() => setOpenId(null)}
          css={css`
            align-self: flex-start;
          `}
        >
          {tr('purchaseRequest.list.add')}
        </Button>
      )}

      <PurchaseRequestDialog
        // Remount per request so the form state starts fresh
        key={openId ?? 'new'}
        open={openId !== undefined}
        projectObjectId={projectObjectId}
        isMaintenance={isMaintenance}
        purchaseRequestId={openId}
        canEdit={canEdit}
        onClose={() => setOpenId(undefined)}
      />
    </Box>
  );
}
