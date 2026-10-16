import { DeleteForeverTwoTone, EditTwoTone } from '@mui/icons-material';
import { Button, Table, TableBody, TableCell, TableHead, TableRow, css } from '@mui/material';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';

import { FrameworkAgreement } from '@shared/schema/frameworkAgreement';

interface Props {
  frameworkAgreements: readonly FrameworkAgreement[];
  onDeleted?: () => void;
}

export function FrameworkAgreementTable(props: Props) {
  const tr = useTranslations();
  const notify = useNotifications();

  const deletion = trpc.frameworkAgreement.delete.useMutation({
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
          <TableCell>{tr('frameworkAgreement.recordNumber')}</TableCell>
          <TableCell>{tr('frameworkAgreement.name')}</TableCell>
          <TableCell>{tr('frameworkAgreement.recordId')}</TableCell>
          <TableCell>{tr('frameworkAgreement.validUntil')}</TableCell>
          <TableCell sx={{ width: 128 }}></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {props.frameworkAgreements.map((agreement) => (
          <TableRow
            key={agreement.id}
            css={css`
              ${!agreement.isValid && 'td:not(:last-of-type) { color: #999; }'}
            `}
          >
            <TableCell>{agreement.recordNumber}</TableCell>
            <TableCell>{agreement.name}</TableCell>
            <TableCell>{agreement.recordId}</TableCell>
            <TableCell>
              {agreement.validUntil
                ? dayjs(agreement.validUntil).format(tr('date.format'))
                : tr('frameworkAgreement.validIndefinitely')}
              {!agreement.isValid && ` (${tr('frameworkAgreement.notValid')})`}
            </TableCell>
            <TableCell sx={{ display: 'flex', gap: '8px' }}>
              <Button
                size="small"
                variant="outlined"
                component={Link}
                replace={true}
                startIcon={<EditTwoTone />}
                to={`?dialog=edit&id=${agreement.id}`}
              >
                {tr('genericForm.editBtnLabel')}
              </Button>
              <Button
                onClick={() => {
                  if (confirm(tr('genericForm.deleteConfirmation'))) {
                    deletion.mutate({ id: agreement.id });
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
