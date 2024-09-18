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
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { useTranslations } from '@frontend/stores/lang';
import { useDebounce } from '@frontend/utils/useDebounce';
import { CompanyForm } from '@frontend/views/Management/Company/CompanyForm';
import { CompanyTable } from '@frontend/views/Management/Company/CompanyTable';

type Props =
  | { dialog?: undefined }
  | {
      dialog: 'new';
    }
  | {
      dialog: 'edit';
      businessId: string;
    };

export function CompanyPage(props: Props) {
  const tr = useTranslations();
  const [query, setQuery] = useState('');
  const companies = trpc.company.search.useQuery(useDebounce(query, 500));
  const loading = companies.isLoading;
  const noResults = companies.data && companies.data.length === 0;

  const navigate = useNavigate();

  return (
    <Box
      css={css`
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 2rem;
        flex: 1;
        min-height: 0; // This is needed to make the company table scrollable
      `}
    >
      <Box
        css={css`
          display: flex;
          justify-content: space-between;
        `}
      >
        <Typography variant="h4" component="h1">
          {tr('management.tabs.companies')}
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
            {tr('company.addCompany')}
          </Button>
        </Box>
      </Box>
      <TextField
        variant="outlined"
        size="medium"
        value={query}
        fullWidth={true}
        placeholder={tr('company.searchPlaceholder')}
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
        {loading && <CircularProgress />}
        {noResults && <div>{tr('company.noResults')}</div>}
        {!noResults && companies.data && (
          <CompanyTable companies={companies.data} onDeleted={() => companies.refetch()} />
        )}
      </Box>

      <Dialog open={Boolean(props.dialog)} onClose={() => navigate('', { replace: true })}>
        <DialogContent
          css={css`
            min-width: 480px;
          `}
        >
          {props.dialog === 'new' && <CompanyForm onSubmitted={() => companies.refetch()} />}
          {props.dialog === 'edit' && (
            <CompanyForm businessId={props.businessId} onSubmitted={() => companies.refetch()} />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
