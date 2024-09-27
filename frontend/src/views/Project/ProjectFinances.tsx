import dayjs from 'dayjs';
import { useSetAtom } from 'jotai';
import { forwardRef, useEffect, useMemo } from 'react';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { getRange } from '@frontend/utils/array';

import { DbInvestmentProject } from '@shared/schema/project/investment';
import { DbMaintenanceProject } from '@shared/schema/project/maintenance';
import { ProjectType } from '@shared/schema/project/type';

import { BudgetFields, BudgetTable } from './BudgetTable';

interface Props {
  project:
    | { type: Omit<ProjectType, 'detailpanProject'>; data?: DbInvestmentProject | null }
    | { type: Omit<ProjectType, 'detailpanProject'>; data?: DbMaintenanceProject | null };
  editable?: boolean;
  writableFields?: BudgetFields[];
  onSave?: () => void;
}

export const ProjectFinances = forwardRef(function ProjectFinances(props: Props, ref) {
  const { project, editable = false } = props;

  const budget = !project.data
    ? null
    : trpc.project.getBudget.useQuery({ projectId: project.data.projectId });
  const notify = useNotifications();
  const tr = useTranslations();

  const projectYears = useMemo(() => {
    if (!project.data?.startDate || !project.data?.endDate) {
      return [];
    }
    const startYear = dayjs(project.data.startDate).get('year');
    const endYear =
      project.data.endDate === 'infinity' ? startYear + 5 : dayjs(project.data.endDate).get('year');
    return getRange(startYear, endYear);
  }, [project.data?.startDate, project.data?.endDate]);

  const saveBudgetMutation = trpc[
    project.type === 'investmentProject' ? 'investmentProject' : 'maintenanceProject'
  ].updateBudget.useMutation({
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
      projectId: project.data?.projectId as string,
      startYear: dayjs(project.data?.startDate).year(),
      endYear:
        project.data?.endDate === 'infinity'
          ? dayjs(project.data?.startDate).year() + 5
          : dayjs(project.data?.endDate).year(),
    },
    { enabled: Boolean(project.data?.projectId) },
  );

  useEffect(() => {
    yearlyActuals.refetch();
  }, [project.data?.sapProjectId]);

  return !budget?.data || !project.data ? null : (
    <BudgetTable
      ref={ref}
      years={projectYears}
      budget={budget.data}
      actuals={yearlyActuals.data}
      actualsLoading={yearlyActuals.isFetching}
      writableFields={editable ? props.writableFields : []}
      onSave={async (yearBudgets) => {
        const payload = yearBudgets.map((yearBudget) => ({
          year: yearBudget.year,
          estimate: yearBudget.budgetItems.estimate ?? null,
        }));
        if (project.data)
          // for typescript to know that project.data is not null or undefined
          await saveBudgetMutation.mutateAsync({
            projectId: project.data.projectId as string,
            budgetItems: payload,
          });
        props.onSave?.();
        budget?.refetch();
      }}
      customTooltips={{
        year:
          project.data.endDate === 'infinity'
            ? tr('budgetTable.yearHelpOngoing')
            : tr('budgetTable.yearHelp'),
      }}
    />
  );
});
