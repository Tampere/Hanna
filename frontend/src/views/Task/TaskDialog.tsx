import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, css } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useMemo } from 'react';

import { trpc } from '@frontend/client';
import { SectionTitle } from '@frontend/components/forms/SectionTitle';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { getRange } from '@frontend/utils/array';
import { BudgetTable } from '@frontend/views/Project/BudgetTable';

import { DbTask } from '@shared/schema/task';

import { DeleteTaskDialog } from './DeleteTaskDialog';
import { TaskForm } from './TaskForm';

interface Props {
  projectObjectId: string;
  task: DbTask;
  open: boolean;
  onClose: () => void;
  isOwner?: boolean;
  canWrite?: boolean;
  canEditFinances?: boolean;
}

const dialogContentStyle = css`
  display: flex;
  flex-direction: column;
`;

const dialogActionsStyle = css`
  display: flex;
  justify-content: space-between;
`;

export function TaskDialog(props: Readonly<Props>) {
  const { projectObjectId, task, open, onClose, isOwner = false, canWrite = false } = props;
  const queryClient = useQueryClient();
  const tr = useTranslations();
  const notify = useNotifications();

  const budget = !task.taskId ? null : trpc.task.getBudget.useQuery({ taskId: task.taskId });

  const years = useMemo(() => {
    if (!task?.startDate || !task?.endDate) {
      return [];
    }
    const startYear = dayjs(task.startDate).get('year');
    const endYear = dayjs(task.endDate).get('year');
    return getRange(startYear, endYear);
  }, [task?.startDate, task?.endDate]);

  const saveBudgetMutation = trpc.task.updateBudget.useMutation({
    onSuccess() {
      notify({
        severity: 'success',
        title: tr('budgetTable.notifySave'),
        duration: 5000,
      });
    },
    onError() {
      notify({
        severity: 'error',
        title: tr('budgetTable.notifySaveFailed'),
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
          userCanModify={isOwner || canWrite}
          onSubmit={() => {
            invalidateTasks();
          }}
        />

        <Box sx={{ mt: 4 }}>
          <SectionTitle title={tr('task.budget')} />
          {!budget?.data ? null : (
            <BudgetTable
              forTask
              enableTooltips={false}
              years={years}
              fields={['amount']}
              writableFields={props.canEditFinances ? ['amount'] : []}
              budget={budget.data}
              actuals={null} // TODO: coming soon
              actualsLoading={false}
              onSave={async (yearBudgets) => {
                const payload = yearBudgets.map((yearBudget) => ({
                  year: yearBudget.year ?? null,
                  amount: yearBudget.budgetItems.amount ?? null,
                }));
                await saveBudgetMutation.mutateAsync({
                  taskId: task.taskId,
                  budgetItems: payload,
                });
                budget?.refetch();
              }}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions css={dialogActionsStyle}>
        <DeleteTaskDialog
          disabled={!isOwner && !canWrite}
          taskId={task.taskId}
          onDeleted={() => {
            invalidateTasks();
            onClose();
          }}
        />

        <Button
          css={css`
            align-self: flex-end;
            justify-self: flex-end;
          `}
          onClick={onClose}
        >
          {tr('close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
