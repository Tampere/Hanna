import dayjs from 'dayjs';
import { useEffect, useMemo } from 'react';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { getRange } from '@frontend/utils/array';

import { DbInvestmentProject } from '@shared/schema/project/investment';

import { BudgetTable } from './BudgetTable';

interface Props {
  project?: DbInvestmentProject | null;
}

export function ProjectFinances(props: Props) {
  const { project } = props;
  const budget = !project ? null : trpc.project.getBudget.useQuery({ projectId: project.id });
  const notify = useNotifications();
  const tr = useTranslations();

  const projectYears = useMemo(() => {
    if (!project?.startDate || !project?.endDate) {
      return [];
    }
    const startYear = dayjs(project.startDate).get('year');
    const endYear = dayjs(project.endDate).get('year');
    return getRange(startYear, endYear);
  }, [project?.startDate, project?.endDate]);

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

  const yearlyActuals = trpc.sap.getYearlyActualsByProjectId.useQuery(
    {
      projectId: project?.id as string,
      startYear: dayjs(project?.startDate).year(),
      endYear: dayjs(project?.endDate).year(),
    },
    { enabled: Boolean(project?.id) }
  );

  useEffect(() => {
    yearlyActuals.refetch();
  }, [project?.sapProjectId]);

  return !budget?.data || !project ? null : (
    <BudgetTable
      years={projectYears}
      budget={budget.data}
      actuals={yearlyActuals.data}
      actualsLoading={yearlyActuals.isFetching}
      onSave={async (yearBudgets) => {
        await saveBudgetMutation.mutateAsync({
          projectId: project.id,
          yearBudgets,
        });
        budget?.refetch();
      }}
    />
  );
}
