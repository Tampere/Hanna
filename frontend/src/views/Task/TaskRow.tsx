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

  function getActivityDescription() {
    if (!props.task.activityId && !props.task.description) {
      return tr('task.noActivityDescription');
    }
    return `${props.task.activityId ?? ''} ${props.task.description ?? ''}`;
  }

  return (
    <>
      <TableRow>
        <TableCell>{getActivityDescription()}</TableCell>
        <TableCell>{formatCurrency(props.task.total)}</TableCell>
      </TableRow>
    </>
  );
}
