import { AddCircle } from '@mui/icons-material';
import { Box, Button, CircularProgress, Dialog, DialogContent, Typography, css } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { useTranslations } from '@frontend/stores/lang';
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
  const companies = trpc.company.getAll.useQuery();
  const loading = companies.isLoading;
  const noResults = companies.data && companies.data.length === 0;

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
        <Typography variant="h4" component="h1">{tr('management.tabs.companies')}</Typography>
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

      <Box
        css={css`
          margin-top: 32px;
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
