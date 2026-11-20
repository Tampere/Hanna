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
import { asyncUserAtom } from '@frontend/stores/auth';
import { useTranslations } from '@frontend/stores/lang';

import { isTranslationKey } from '@shared/language';
import type { SetSapIdentifierResult } from '@shared/schema/sapIdentifierRequest';
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
 * Page linked from the SAP identifier request email (Figma 6248-311).
 * Finance office users enter the SAP project id (hanke) or WBS id (kohde) here.
 */
export function SapIdentifierEntry() {
  const tr = useTranslations();
  const user = useAtomValue(asyncUserAtom);
  const { projectId, projectObjectId } = useParams() as {
    projectId: string;
    projectObjectId?: string;
  };
  const target = { projectId, projectObjectId: projectObjectId ?? null };
  const isProjectObject = Boolean(projectObjectId);
  const hasPermission = canSetFinanceIdentifiers(user);

  const utils = trpc.useUtils();
  const view = trpc.sapIdentifier.getFinanceView.useQuery(target, { enabled: hasPermission });
  const [identifier, setIdentifier] = useState('');
  const [result, setResult] = useState<SetSapIdentifierResult | null>(null);

  const setMutation = trpc.sapIdentifier.setIdentifier.useMutation({
    onSuccess: (data) => setResult(data),
  });

  /** Back to the entry form, prefilled with the saved identifier, to correct it. */
  function fixIdentifier(saved: string) {
    setIdentifier(saved);
    setResult(null);
    setMutation.reset();
    utils.sapIdentifier.getFinanceView.invalidate(target);
  }

  const variant = isProjectObject ? 'projectObject' : 'project';
  const hannaUrl = view.data
    ? `/${
        view.data.projectType === 'investmentProject' ? 'investointihanke' : 'kunnossapitohanke'
      }/${projectId}${projectObjectId ? `/kohde/${projectObjectId}` : ''}`
    : null;

  function content() {
    if (!hasPermission) {
      return <Alert severity="warning">{tr('sapIdentifier.finance.noPermission')}</Alert>;
    }
    if (view.isLoading) {
      return <CircularProgress size="2rem" />;
    }
    if (view.isError || !view.data) {
      return <Alert severity="error">{tr('sapIdentifier.finance.notFound')}</Alert>;
    }

    const heading = (
      <>
        <Typography
          css={css`
            font-weight: 600;
            font-size: 1.25rem;
            color: #525252;
          `}
        >
          {tr(`sapIdentifier.finance.title.${variant}` as const)}
        </Typography>
        <Typography css={titleStyle}>{view.data.title}</Typography>
      </>
    );

    if (result) {
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
              {tr(`sapIdentifier.finance.success.${variant}` as const, result.identifier)}
              <br />
              {tr('sapIdentifier.finance.successClose')}
            </Typography>
          </Box>
          {result.warning && (
            <Alert
              severity="warning"
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => fixIdentifier(result.identifier)}
                >
                  {tr('sapIdentifier.finance.fix')}
                </Button>
              }
            >
              {tr(`sapIdentifier.warning.${result.warning}` as const)}
            </Alert>
          )}
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
        <Typography variant="body2">
          {tr(`sapIdentifier.finance.info.${variant}` as const)}
        </Typography>
        {view.data.identifier && (
          <Alert severity="info">
            {tr('sapIdentifier.finance.alreadySet', view.data.identifier)}
          </Alert>
        )}
        {isProjectObject && !view.data.parentProjectSapId && (
          <Alert severity="warning">{tr('sapIdentifier.error.parentProjectSapIdMissing')}</Alert>
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
            if (identifier.trim()) {
              setMutation.mutate({ ...target, identifier: identifier.trim() });
            }
          }}
        >
          <FormLabel htmlFor="sap-identifier">
            {tr(`sapIdentifier.finance.field.${variant}` as const)}
          </FormLabel>
          <TextField
            id="sap-identifier"
            size="small"
            autoFocus
            placeholder={tr(`sapIdentifier.finance.placeholder.${variant}` as const) as string}
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
          />
          {setMutation.isError && (
            <Alert severity="error">
              {isTranslationKey(setMutation.error.message)
                ? tr(setMutation.error.message)
                : tr('sapIdentifier.finance.saveFailed')}
            </Alert>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={!identifier.trim() || setMutation.isLoading}
            css={css`
              align-self: center;
              margin-top: 16px;
            `}
            endIcon={setMutation.isLoading ? <CircularProgress size="1rem" /> : undefined}
          >
            {tr('sapIdentifier.finance.save')}
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
