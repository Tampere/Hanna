import { DeleteForeverTwoTone, EditTwoTone } from '@mui/icons-material';
import { Button, Table, TableBody, TableCell, TableHead, TableRow, css } from '@mui/material';
import { Link } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';

import { CompanyContactSearchResult } from '@shared/schema/company';

interface Props {
  contacts: readonly CompanyContactSearchResult[];
  onDeleted?: () => void;
}

export function CompanyContactTable(props: Props) {
  const tr = useTranslations();
  const notify = useNotifications();

  const contactDeletion = trpc.company.deleteContact.useMutation({
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
      <TableHead
        css={css`
          position: sticky;
          top: 0;
          background-color: white;
          z-index: 1;
          outline: 1px solid rgba(0, 0, 0, 0.5);
          th {
            border: 0;
          }
        `}
      >
        <TableRow>
          <TableCell>{tr('companyContact.name')}</TableCell>
          <TableCell>{tr('companyContact.phone')}</TableCell>
          <TableCell>{tr('companyContact.email')}</TableCell>
          <TableCell>{tr('company.name')}</TableCell>
          <TableCell>{tr('company.businessId')}</TableCell>
          <TableCell sx={{ width: '128px' }}></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {props.contacts.map((contact) => (
          <TableRow key={contact.id}>
            <TableCell>{contact.contactName}</TableCell>
            <TableCell>{contact.phoneNumber}</TableCell>
            <TableCell>{contact.emailAddress}</TableCell>
            <TableCell>{contact.companyName}</TableCell>
            <TableCell>{contact.businessId}</TableCell>
            <TableCell sx={{ display: 'flex', gap: '8px' }}>
              <Button
                size="small"
                variant="outlined"
                component={Link}
                replace={true}
                to={`?dialog=edit&contactId=${contact.id}`}
                startIcon={<EditTwoTone />}
              >
                {tr('genericForm.editBtnLabel')}
              </Button>
              <Button
                onClick={() => {
                  if (confirm(tr('genericForm.deleteConfirmation'))) {
                    contactDeletion.mutate({ id: contact.id });
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
