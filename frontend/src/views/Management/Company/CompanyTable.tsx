import {
  Delete,
  DeleteForever,
  DeleteForeverTwoTone,
  EditTwoTone,
  Remove,
} from '@mui/icons-material';
import {
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { Link } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';

import { Company } from '@shared/schema/contractor';

interface Props {
  companies: readonly Company[];
  onDeleted?: () => void;
}

export function CompanyTable(props: Props) {
  const tr = useTranslations();
  const notify = useNotifications();

  const companyDeletion = trpc.contractor.deleteCompany.useMutation({
    onSuccess: () => {
      props.onDeleted?.();
      notify({
        title: tr('genericForm.notifySubmitSuccess'),
        severity: 'success',
        duration: 5000,
      });
    },
    onError: () => {
      notify({
        title: tr('genericForm.notifySubmitFailure'),
        severity: 'error',
      });
    },
  });

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>{tr('company.name')}</TableCell>
          <TableCell>{tr('company.businessId')}</TableCell>
          <TableCell sx={{ width: 128 }}></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {props.companies.map((company) => (
          <TableRow key={company.businessId}>
            <TableCell>{company.companyName}</TableCell>
            <TableCell>{company.businessId}</TableCell>
            <TableCell sx={{ display: 'flex', gap: '8px' }}>
              <Button
                size="small"
                variant="outlined"
                component={Link}
                replace={true}
                startIcon={<EditTwoTone />}
                to={`?dialog=edit&businessId=${company.businessId}`}
              >
                {tr('genericForm.editBtnLabel')}
              </Button>
              <Button
                onClick={() => {
                  if (confirm(tr('genericForm.deleteConfirmation'))) {
                    companyDeletion.mutate({ businessId: company.businessId });
                  }
                }}
                color="secondary"
                size="small"
                variant="outlined"
                startIcon={<DeleteForeverTwoTone />}
              >
                {tr('genericForm.deleteBtnLabel')}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
