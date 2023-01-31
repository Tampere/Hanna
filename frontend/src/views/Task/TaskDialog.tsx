import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, css } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useMemo } from 'react';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { getRange } from '@frontend/utils/array';
import { CostEstimatesTable } from '@frontend/views/Project/CostEstimatesTable';

import { DbTask } from '@shared/schema/task';

import { DeleteTaskDialog } from './DeleteTaskDialog';
import { TaskForm } from './TaskForm';

interface Props {
  projectObjectId: string;
  task: DbTask;
  open: boolean;
  onClose: () => void;
}

const dialogContentStyle = css`
  display: flex;
  flex-direction: column;
`;

const dialogActionsStyle = css`
  display: flex;
  justify-content: space-between;
`;

export function TaskDialog(props: Props) {
  const { projectObjectId, task, open, onClose } = props;
  const queryClient = useQueryClient();
  const tr = useTranslations();
  const notify = useNotifications();

  const estimates = !task.id ? null : trpc.project.getCostEstimates.useQuery({ taskId: task.id });

  const years = useMemo(() => {
    if (!task?.startDate || !task?.endDate) {
      return [];
    }
    const startYear = dayjs(task.startDate).get('year');
    const endYear = dayjs(task.endDate).get('year');
    return getRange(startYear, endYear);
  }, [task?.startDate, task?.endDate]);

  const saveEstimatesMutation = trpc.project.updateCostEstimates.useMutation({
    onSuccess() {
      notify({
        severity: 'success',
        title: tr('costEstimatesTable.notifySave'),
        duration: 5000,
      });
    },
    onError() {
      notify({
        severity: 'error',
        title: tr('costEstimatesTable.notifySaveFailed'),
      });
    },
  });

  function invalidateTasks() {
    queryClient.invalidateQueries({
      queryKey: [['task', 'getByProjectObjectId'], { input: { projectObjectId } }],
    });
  }

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { width: 800, maxWidth: '90%' } }}>
      <DialogTitle>{task.taskName}</DialogTitle>
      <DialogContent css={dialogContentStyle}>
        <TaskForm
          projectObjectId={projectObjectId}
          task={task}
          onSubmit={() => {
            invalidateTasks();
          }}
        />

        <Box sx={{ mt: 4 }}>
          {!estimates?.data ? null : (
            <CostEstimatesTable
              years={years}
              estimates={estimates.data}
              actuals={null} // TODO: coming soon
              actualsLoading={false}
              onSave={async (costEstimates) => {
                await saveEstimatesMutation.mutateAsync({
                  taskId: task.id,
                  costEstimates,
                });
                estimates?.refetch();
              }}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions css={dialogActionsStyle}>
        <DeleteTaskDialog
          taskId={task.id}
          onDeleted={() => {
            invalidateTasks();
            onClose();
          }}
        />
        <Button onClick={onClose}>{tr('close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
