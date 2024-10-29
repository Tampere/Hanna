import { TableCell, TableRow } from '@mui/material';

import { formatCurrency } from '@frontend/components/forms/CurrencyInput';
import { useTranslations } from '@frontend/stores/lang';

import { SapTask } from '@shared/schema/task';

interface Props {
  projectObjectId: string;
  task: SapTask;
}

export function TaskRow(props: Readonly<Props>) {
  const tr = useTranslations();
  return (
    <>
      <TableRow>
        <TableCell>{props.task.description ?? tr('task.noActivityDescription')}</TableCell>
        <TableCell>{formatCurrency(props.task.total)}</TableCell>
      </TableRow>
    </>
  );
}
