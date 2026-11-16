import { css } from '@emotion/react';
import { CheckCircleOutline } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormLabel,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { useParams } from 'react-router';
import { Link } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { formatCurrency } from '@frontend/components/forms/CurrencyInput';
import { asyncUserAtom } from '@frontend/stores/auth';
import { useTranslations } from '@frontend/stores/lang';

import { isTranslationKey } from '@shared/language';
import { sumPhasePrices } from '@shared/schema/purchaseRequest';
import { canSetFinanceIdentifiers } from '@shared/schema/userPermissions';

const cardStyle = css`
  width: 540px;
  max-width: calc(100% - 32px);
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const titleStyle = css`
  font-size: 2rem;
  color: #22437b;
  margin-top: -8px;
`;

/**
 * Page linked from the purchase request email. Finance office users enter the
 * purchase order number here (same layout as the SAP identifier page, Figma 6248-311).
 */
export function PurchaseOrderNumberEntry() {
  const tr = useTranslations();
  const user = useAtomValue(asyncUserAtom);
  const { purchaseRequestId } = useParams() as { purchaseRequestId: string };
  const hasPermission = canSetFinanceIdentifiers(user);

  const request = trpc.purchaseRequest.get.useQuery(
    { id: purchaseRequestId },
    { enabled: hasPermission },
  );
  const [orderNumber, setOrderNumber] = useState('');
  const [saved, setSaved] = useState<string | null>(null);

  const setMutation = trpc.purchaseRequest.setPurchaseOrderNumber.useMutation({
    onSuccess: (data) => setSaved(data.purchaseOrderNumber),
  });

  const hannaUrl = request.data
    ? `/${
        request.data.projectType === 'investmentProject' ? 'investointihanke' : 'kunnossapitohanke'
      }/${request.data.projectId}/kohde/${request.data.projectObjectId}?tab=kuluseuranta`
    : null;

  function content() {
    if (!hasPermission) {
      return <Alert severity="warning">{tr('sapIdentifier.finance.noPermission')}</Alert>;
    }
    if (request.isLoading) {
      return <CircularProgress size="2rem" />;
    }
    if (request.isError || !request.data) {
      return <Alert severity="error">{tr('purchaseRequest.error.notFound')}</Alert>;
    }

    const data = request.data;
    const amount =
      data.isContractPrice && data.contractPrice != null
        ? data.contractPrice
        : data.phasePrices.length > 0
          ? sumPhasePrices(data.phasePrices)
          : null;

    const heading = (
      <>
        <Typography
          css={css`
            font-weight: 600;
            font-size: 1.25rem;
            color: #525252;
          `}
        >
          {tr('purchaseRequest.finance.title')}
        </Typography>
        <Typography css={titleStyle}>{data.objectName}</Typography>
        <Typography variant="body2">
          {[
            data.companyName,
            `(${data.costCenterId}) ${data.costCenterName}`,
            data.frameworkAgreementName,
          ]
            .filter(Boolean)
            .join(', ')}
          {amount != null && ` - ${formatCurrency(amount)}`}
        </Typography>
      </>
    );

    if (saved) {
      return (
        <>
          {heading}
          <Box
            css={css`
              display: flex;
              align-items: center;
              gap: 16px;
            `}
          >
            <CheckCircleOutline
              css={css`
                font-size: 80px;
                color: #4a9e2c;
              `}
            />
            <Typography variant="body1">
              {tr('purchaseRequest.finance.success', saved)}
              <br />
              {tr('sapIdentifier.finance.successClose')}
            </Typography>
          </Box>
          {hannaUrl && (
            <Button component={Link} to={hannaUrl} variant="text">
              {tr('sapIdentifier.finance.openInHanna')}
            </Button>
          )}
        </>
      );
    }

    return (
      <>
        {heading}
        <Typography variant="body2">{tr('purchaseRequest.finance.info')}</Typography>
        {data.purchaseOrderNumber && (
          <Alert severity="info">
            {tr('purchaseRequest.finance.alreadySet', data.purchaseOrderNumber)}
          </Alert>
        )}
        <Box
          component="form"
          css={css`
            display: flex;
            flex-direction: column;
            gap: 4px;
          `}
          onSubmit={(event) => {
            event.preventDefault();
            if (orderNumber.trim()) {
              setMutation.mutate({
                id: purchaseRequestId,
                purchaseOrderNumber: orderNumber.trim(),
              });
            }
          }}
        >
          <FormLabel htmlFor="purchase-order-number">
            {tr('purchaseRequest.finance.field')}
          </FormLabel>
          <TextField
            id="purchase-order-number"
            size="small"
            autoFocus
            placeholder={tr('purchaseRequest.finance.placeholder') as string}
            value={orderNumber}
            onChange={(event) => setOrderNumber(event.target.value)}
          />
          {setMutation.isError && (
            <Alert severity="error">
              {isTranslationKey(setMutation.error.message)
                ? tr(setMutation.error.message)
                : tr('purchaseRequest.finance.saveFailed')}
            </Alert>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={!orderNumber.trim() || setMutation.isLoading}
            css={css`
              align-self: center;
              margin-top: 16px;
            `}
            endIcon={setMutation.isLoading ? <CircularProgress size="1rem" /> : undefined}
          >
            {tr('purchaseRequest.finance.save')}
          </Button>
        </Box>
      </>
    );
  }

  return (
    <Box
      css={css`
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding-top: 10vh;
        height: 100%;
        overflow-y: auto;
      `}
    >
      <Paper css={cardStyle}>{content()}</Paper>
    </Box>
  );
}
