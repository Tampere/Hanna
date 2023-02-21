import { DeleteForeverTwoTone, EditTwoTone } from '@mui/icons-material';
import { Button, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { Link } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';

import { SearchResult } from '@shared/schema/contractor';

interface Props {
  contractors: readonly SearchResult[];
  onDeleted?: () => void;
}

export function ContractorTable(props: Props) {
  const tr = useTranslations();
  const notify = useNotifications();

  const contractorDeletion = trpc.contractor.deleteContractor.useMutation({
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
          <TableCell>{tr('contractor.name')}</TableCell>
          <TableCell>{tr('contractor.phone')}</TableCell>
          <TableCell>{tr('contractor.email')}</TableCell>
          <TableCell>{tr('company.name')}</TableCell>
          <TableCell>{tr('company.businessId')}</TableCell>
          <TableCell sx={{ width: '128px' }}></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {props.contractors.map((contractor) => (
          <TableRow key={contractor.id}>
            <TableCell>{contractor.contactName}</TableCell>
            <TableCell>{contractor.phoneNumber}</TableCell>
            <TableCell>{contractor.emailAddress}</TableCell>
            <TableCell>{contractor.companyName}</TableCell>
            <TableCell>{contractor.businessId}</TableCell>
            <TableCell sx={{ display: 'flex', gap: '8px' }}>
              <Button
                size="small"
                variant="outlined"
                component={Link}
                replace={true}
                to={`?dialog=edit&contractorId=${contractor.id}`}
                startIcon={<EditTwoTone />}
              >
                {tr('genericForm.editBtnLabel')}
              </Button>
              <Button
                onClick={() => {
                  if (confirm(tr('genericForm.deleteConfirmation'))) {
                    contractorDeletion.mutate({ id: contractor.id });
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
