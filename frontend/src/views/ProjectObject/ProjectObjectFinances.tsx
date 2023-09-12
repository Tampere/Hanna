import dayjs from 'dayjs';
import { useEffect, useMemo } from 'react';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { getRange } from '@frontend/utils/array';

import { DBProjectObject } from '@shared/schema/projectObject';

import { BudgetTable } from '../Project/BudgetTable';

interface Props {
  projectObject: DBProjectObject;
}

export function ProjectObjectFinances(props: Props) {
  const { projectObject } = props;
  const budget = !projectObject.id
    ? null
    : trpc.project.getBudget.useQuery({ projectObjectId: projectObject.id });

  const notify = useNotifications();
  const tr = useTranslations();

  const years = useMemo(() => {
    if (!projectObject?.startDate || !projectObject?.endDate) {
      return [];
    }
    const startYear = dayjs(projectObject.startDate).get('year');
    const endYear = dayjs(projectObject.endDate).get('year');
    return getRange(startYear, endYear);
  }, [projectObject?.startDate, projectObject?.endDate]);

  const saveBudgetMutation = trpc.project.updateBudget.useMutation({
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

  const yearlyActuals = trpc.sap.getYearlyActualsByProjectObjectId.useQuery(
    {
      projectObjectId: projectObject.id,
      startYear: dayjs(projectObject?.startDate).year(),
      endYear: dayjs(projectObject?.endDate).year(),
    },
    { enabled: Boolean(projectObject?.id) }
  );

  useEffect(() => {
    yearlyActuals.refetch();
  }, [projectObject?.sapWBSId]);

  return !budget?.data ? null : (
    <BudgetTable
      years={years}
      budget={budget.data}
      actuals={yearlyActuals.data}
      actualsLoading={yearlyActuals.isFetching}
      onSave={async (yearBudgets) => {
        await saveBudgetMutation.mutateAsync({
          projectObjectId: projectObject.id,
          yearBudgets,
        });
        budget.refetch();
      }}
    />
  );
}
