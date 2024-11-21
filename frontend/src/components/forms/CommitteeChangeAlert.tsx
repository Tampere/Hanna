import { Alert, Box, Button, css } from '@mui/material';
import { useEffect } from 'react';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';

type Props = {
  onCancel: () => void;
  onDelete: () => void;

  setFormError: () => void;
  isVisible: boolean;
} & (
  | { itemType: 'project'; projectId: string; removedCommittees: string[] }
  | { itemType: 'projectObject'; projectObjectId: string; removedCommittees: string }
);

export function CommitteeChangeAlert(props: Props) {
  const notify = useNotifications();
  const budget =
    props.itemType === 'project'
      ? trpc.project.getBudget.useQuery({ projectId: props.projectId })
      : trpc.projectObject.getBudget.useQuery({ projectObjectId: props.projectObjectId });

  const mutationOptions = {
    onSuccess() {
      notify({
        severity: 'success',
        title: tr('projectForm.committeeChangeAlert.deleteSuccess'),
        duration: 5000,
      });
    },
    onError() {
      notify({
        severity: 'error',
        title: tr('projectForm.committeeChangeAlert.deleteFailed'),
      });
    },
  };

  const deleteProjectBudget = trpc.investmentProject.deleteBudget.useMutation(mutationOptions);
  const deleteProjectObjectBudget =
    trpc.investmentProjectObject.deleteBudget.useMutation(mutationOptions);

  const tr = useTranslations();

  useEffect(() => {
    if (!budget.data) return;

    const budgetCommittees = budget.data
      .filter((item) => Object.values(item.budgetItems).some(Boolean))
      .map((item) => item.committee);

    if (
      budgetCommittees.some(
        (budgetCommittee) => budgetCommittee && props.removedCommittees.includes(budgetCommittee),
      ) &&
      !props.isVisible
    ) {
      props.setFormError();
    }
  }, [budget.data, props.removedCommittees]);

  if (!props.isVisible) return null;

  return (
    <Alert
      css={css`
        margin-top: 1rem;
      `}
      severity="warning"
    >
      {tr('projectForm.committeeChangeAlert')}
      <Box
        css={css`
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          height: 30px;
          margin-top: 1rem;
        `}
      >
        <Button color="inherit" variant="outlined" onClick={() => props.onCancel()}>
          {tr('cancel')}
        </Button>
        <Button
          color="inherit"
          variant="outlined"
          onClick={async () => {
            if (props.itemType === 'project') {
              await deleteProjectBudget.mutateAsync({
                projectId: props.projectId,
                committees: props.removedCommittees,
              });
            } else {
              await deleteProjectObjectBudget.mutateAsync({
                projectObjectId: props.projectObjectId,
                committees: [props.removedCommittees],
              });
            }

            props.onDelete();
          }}
        >
          {tr('delete')}
        </Button>
      </Box>
    </Alert>
  );
}
