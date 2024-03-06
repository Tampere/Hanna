import { Link, TableCell, TableRow, css } from '@mui/material';
import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import { useState } from 'react';

import { langAtom, useTranslations } from '@frontend/stores/lang';
import { useCodes } from '@frontend/utils/codes';

import { DbTask } from '@shared/schema/task';

import { TaskDialog } from './TaskDialog';

interface Props {
  projectObjectId: string;
  task: DbTask;
  isOwner?: boolean;
  canWrite?: boolean;
}

const stickyColumnStyle = css`
  position: sticky;
  left: 0;
  background: #fff;
`;

export function TaskRow(props: Readonly<Props>) {
  const { task, projectObjectId } = props;
  const tr = useTranslations();
  const lang = useAtomValue(langAtom);
  const [dialogOpen, setDialogOpen] = useState(false);

  const codes = {
    lifecycleState: useCodes('TehtävänElinkaarentila'),
    taskType: useCodes('TehtäväTyyppi'),
  };

  return (
    <>
      <TableRow>
        <TableCell css={stickyColumnStyle}>
          <Link component="button" variant="body2" onClick={() => setDialogOpen(true)}>
            {task.taskName}
          </Link>
        </TableCell>
        <TableCell>{codes.lifecycleState?.get(task.lifecycleState)?.[lang]}</TableCell>
        <TableCell>
          {task.taskType} {codes.taskType?.get(task.taskType)?.[lang]}
        </TableCell>
        <TableCell>{dayjs(task.startDate).format(tr('date.format'))}</TableCell>
        <TableCell>{dayjs(task.endDate).format(tr('date.format'))}</TableCell>
      </TableRow>
      <TaskDialog
        open={dialogOpen}
        projectObjectId={projectObjectId}
        task={task}
        isOwner={props.isOwner}
        canWrite={props.canWrite}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}
