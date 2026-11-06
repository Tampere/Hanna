import { AddCircle, SearchTwoTone } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  InputAdornment,
  TextField,
  Typography,
  css,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { useTranslations } from '@frontend/stores/lang';
import { FrameworkAgreementForm } from '@frontend/views/Management/FrameworkAgreement/FrameworkAgreementForm';
import { FrameworkAgreementTable } from '@frontend/views/Management/FrameworkAgreement/FrameworkAgreementTable';

type Props =
  | { dialog?: undefined }
  | {
      dialog: 'new';
    }
  | {
      dialog: 'edit';
      id: string;
    };

export function FrameworkAgreementPage(props: Props) {
  const tr = useTranslations();
  const [query, setQuery] = useState('');
  const frameworkAgreements = trpc.frameworkAgreement.getAll.useQuery();

  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const searchTerm = query.trim().toLowerCase();
    if (!searchTerm) return frameworkAgreements.data ?? [];
    return (frameworkAgreements.data ?? []).filter((agreement) =>
      [agreement.name, agreement.recordId].some((value) =>
        value.toLowerCase().includes(searchTerm),
      ),
    );
  }, [frameworkAgreements.data, query]);

  const noResults = frameworkAgreements.data && filtered.length === 0;

  return (
    <Box
      css={css`
        padding: 16px;
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 2rem;
        flex: 1;
        min-height: 0; // This is needed to make the table scrollable
      `}
    >
      <Box
        css={css`
          display: flex;
          justify-content: space-between;
        `}
      >
        <Typography variant="h4" component="h1">
          {tr('management.tabs.frameworkAgreements')}
        </Typography>
        <Box
          css={css`
            display: flex;
            gap: 8px;
            height: max-content;
          `}
        >
          <Button
            component={Link}
            replace={true}
            to={'?dialog=new'}
            variant="contained"
            endIcon={<AddCircle />}
          >
            {tr('frameworkAgreement.addFrameworkAgreement')}
          </Button>
        </Box>
      </Box>
      <TextField
        variant="outlined"
        size="medium"
        value={query}
        fullWidth={true}
        placeholder={tr('frameworkAgreement.searchPlaceholder')}
        onChange={(e) => setQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchTwoTone />
            </InputAdornment>
          ),
        }}
      />
      <Box
        css={css`
          overflow: auto;
        `}
      >
        {frameworkAgreements.isLoading && <CircularProgress />}
        {noResults && <div>{tr('frameworkAgreement.noResults')}</div>}
        {!noResults && frameworkAgreements.data && (
          <FrameworkAgreementTable frameworkAgreements={filtered} />
        )}
      </Box>

      <Dialog open={Boolean(props.dialog)} onClose={() => navigate('', { replace: true })}>
        <DialogContent
          css={css`
            min-width: 480px;
          `}
        >
          {props.dialog === 'new' && (
            <FrameworkAgreementForm onSubmitted={() => frameworkAgreements.refetch()} />
          )}
          {props.dialog === 'edit' && (
            <FrameworkAgreementForm
              id={props.id}
              onSubmitted={() => frameworkAgreements.refetch()}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
