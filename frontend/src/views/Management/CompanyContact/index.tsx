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
import { CompanyContactForm } from '@frontend/views/Management/CompanyContact/CompanyContactForm';
import { CompanyContactTable } from '@frontend/views/Management/CompanyContact/CompanyContactTable';

type Props =
  | { dialog?: undefined }
  | {
      dialog: 'new';
    }
  | {
      dialog: 'edit';
      contactId: string;
    };

export function CompanyContactPage(props: Props) {
  const [query, setQuery] = useState('');
  const tr = useTranslations();
  const contacts = trpc.company.searchContacts.useQuery({ query: useDebounce(query, 500) });

  const loading = contacts.isLoading;
  const noResults = contacts.data && contacts.data.length === 0;

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
          justify-content: space-between;
          margin-bottom: 24px;
        `}
      >
        <Typography variant="h4" component="h1">{tr('management.tabs.companyContacts')}</Typography>
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
            {tr('companyContact.addContact')}
          </Button>
        </Box>
      </Box>

      <TextField
        variant="outlined"
        size="medium"
        value={query}
        fullWidth={true}
        placeholder={tr('companyContact.searchPlaceholder')}
        onChange={(e) => setQuery(e.target.value)}
        InputProps={{startAdornment: (
        <InputAdornment position="start">
          <SearchTwoTone />
        </InputAdornment>)}}
      />

      <Box
        css={css`
          margin-top: 32px;
        `}
      >
        {loading && <CircularProgress />}
        {noResults && <div>{tr('companyContact.noSearchResults')}</div>}
        {!noResults && contacts.data && (
          <CompanyContactTable contacts={contacts.data} onDeleted={() => contacts.refetch()} />
        )}
      </Box>

      <Dialog open={Boolean(props.dialog)} onClose={() => navigate('', { replace: true })}>
        <DialogContent
          css={css`
            min-width: 480px;
          `}
        >
          {props.dialog === 'new' && <CompanyContactForm onSubmitted={() => contacts.refetch()} />}
          {props.dialog === 'edit' && (
            <CompanyContactForm
              contactId={props.contactId}
              onSubmitted={() => contacts.refetch()}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
