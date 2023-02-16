import { AddCircle } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  TextField,
  css,
} from '@mui/material';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { useTranslations } from '@frontend/stores/lang';
import { useDebounce } from '@frontend/utils/useDebounce';
import { ContractorForm } from '@frontend/views/Management/Contractor/ContractorForm';
import { ContractorTable } from '@frontend/views/Management/Contractor/ContractorTable';

type Props =
  | { dialog?: undefined }
  | {
      dialog: 'new';
    }
  | {
      dialog: 'edit';
      contractorId: string;
    };

export function ContractorPage(props: Props) {
  const [query, setQuery] = useState('');
  const tr = useTranslations();
  const contractors = trpc.contractor.search.useQuery({ query: useDebounce(query, 500) });

  const loading = contractors.isLoading;
  const noResults = contractors.data && contractors.data.length === 0;

  const navigate = useNavigate();

  return (
    <Box
      css={css`
        padding: 16px;
      `}
    >
      <Box
        css={css`
          display: flex;
          justify-content: flex-end;
          margin-bottom: 24px;
        `}
      >
        <Box
          css={css`
            display: flex;
            gap: 8px;
          `}
        >
          <Button
            component={Link}
            replace={true}
            to={'?dialog=new'}
            variant="contained"
            endIcon={<AddCircle />}
          >
            {tr('contractor.addContractor')}
          </Button>
        </Box>
      </Box>

      <TextField
        variant="outlined"
        size="medium"
        value={query}
        fullWidth={true}
        placeholder={tr('contractor.searchPlaceholder')}
        onChange={(e) => setQuery(e.target.value)}
      />

      <Box
        css={css`
          margin-top: 32px;
        `}
      >
        {loading && <CircularProgress />}
        {noResults && <div>{tr('contractor.noSearchResults')}</div>}
        {!noResults && contractors.data && <ContractorTable contractors={contractors.data} />}
      </Box>

      <Dialog open={Boolean(props.dialog)} onClose={() => navigate('', { replace: true })}>
        <DialogContent
          css={css`
            min-width: 480px;
          `}
        >
          {props.dialog === 'new' && <ContractorForm onSubmitted={() => contractors.refetch()} />}
          {props.dialog === 'edit' && (
            <ContractorForm
              contractorId={props.contractorId}
              onSubmitted={() => contractors.refetch()}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
