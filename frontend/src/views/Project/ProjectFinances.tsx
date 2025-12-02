import dayjs from 'dayjs';
import { forwardRef, useEffect, useMemo } from 'react';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { getRange } from '@frontend/utils/array';

import { ProjectYearBudget } from '@shared/schema/project';
import { DbInvestmentProject } from '@shared/schema/project/investment';
import { DbMaintenanceProject } from '@shared/schema/project/maintenance';
import { ProjectType } from '@shared/schema/project/type';
import { CommonDbProjectObject } from '@shared/schema/projectObject/base';

import { BudgetField, BudgetTable } from './BudgetTable';

interface Props {
  project:
    | { type: Omit<ProjectType, 'detailpanProject'>; data?: DbInvestmentProject | null }
    | { type: Omit<ProjectType, 'detailpanProject'>; data?: DbMaintenanceProject | null };
  editable?: boolean;
  writableFields?: BudgetField[];
  projectObjects?: CommonDbProjectObject[];
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
      project.data.endDate === 'infinity'
        ? Math.max(dayjs().year() + 5, dayjs(project.data.startDate).get('year') + 5)
        : dayjs(project.data.endDate).get('year');
    return getRange(startYear, endYear);
  }, [project.data?.startDate, project.data?.endDate]);

  const saveBudgetMutationOptions = {
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
  };

  const saveInvestmentBudgetMutation =
    trpc.investmentProject.updateBudget.useMutation(saveBudgetMutationOptions);
  const saveMaintenanceBudgetMutation =
    trpc.maintenanceProject.updateBudget.useMutation(saveBudgetMutationOptions);

  const saveInvestmentProjectObjectBudgetMutation =
    trpc.investmentProjectObject.updateBudget.useMutation(saveBudgetMutationOptions);
  const saveMaintenanceProjectObjectBudgetMutation =
    trpc.maintenanceProjectObject.updateBudget.useMutation(saveBudgetMutationOptions);

  async function handleSaveBudget(
    yearBudgets: ProjectYearBudget[],
    projectObjectBudgets?: {
      projectObjectId: string;
      year: number;
      budgetItems: ProjectYearBudget['budgetItems'];
    }[],
  ) {
    if (project.data) {
      // for typescript to know that project.data is not null or undefined
      if (project.type === 'investmentProject') {
        type InvestmentProjectBudget = { year: number; committee: string; estimate: number | null };
        const payload = yearBudgets
          .map((yearBudget) => ({
            year: yearBudget.year,
            estimate: yearBudget.budgetItems.estimate ?? null,
            committee: yearBudget.committee,
          }))
          .filter<InvestmentProjectBudget>((item): item is InvestmentProjectBudget =>
            Boolean(item.committee),
          );

        if (payload.length > 0) {
          await saveInvestmentBudgetMutation.mutateAsync({
            projectId: project.data.projectId as string,
            budgetItems: payload,
          });
        }
      } else {
        type MaintenanceProjectBudget = { year: number; estimate: number | null; committee: null };
        const payload = yearBudgets
          .map((yearBudget) => ({
            year: yearBudget.year,
            estimate: yearBudget.budgetItems.estimate ?? null,
            committee: null,
          }))
          .filter<MaintenanceProjectBudget>((item): item is MaintenanceProjectBudget =>
            Boolean(item),
          );

        if (payload.length > 0) {
          await saveMaintenanceBudgetMutation.mutateAsync({
            projectId: project.data.projectId as string,
            budgetItems: payload,
          });
        }
      }
    }

    // Save project object budgets if provided
    if (projectObjectBudgets && projectObjectBudgets.length > 0) {
      const groupedByObject = projectObjectBudgets.reduce<
        Record<
          string,
          {
            year: number;
            committee: string | null;
            budgetItems: ProjectYearBudget['budgetItems'];
          }[]
        >
      >((acc, item) => {
        const key = item.projectObjectId;
        if (!acc[key]) acc[key] = [];
        acc[key].push({
          year: item.year,
          committee:
            project.type === 'investmentProject' ? project.data?.committees?.[0] ?? null : null,
          budgetItems: item.budgetItems,
        });
        return acc;
      }, {});

      for (const [projectObjectId, items] of Object.entries(groupedByObject)) {
        if (project.type === 'investmentProject') {
          type InvestmentProjectObjectBudget = ProjectYearBudget['budgetItems'] & {
            year: number;
            committee: string;
          };
          const payload: InvestmentProjectObjectBudget[] = items
            .map((item) => ({
              ...item.budgetItems,
              year: item.year,
              committee: (item.committee ?? '') as string,
            }))
            .filter<InvestmentProjectObjectBudget>((b): b is InvestmentProjectObjectBudget =>
              Boolean(b.committee),
            );

          if (payload.length > 0) {
            await saveInvestmentProjectObjectBudgetMutation.mutateAsync({
              projectObjectId,
              budgetItems: payload,
            });
          }
        } else {
          type MaintenanceProjectObjectBudget = ProjectYearBudget['budgetItems'] & {
            year: number;
            committee: null;
          };
          const payload: MaintenanceProjectObjectBudget[] = items.map((item) => ({
            ...item.budgetItems,
            year: item.year,
            committee: null,
          }));

          if (payload.length > 0) {
            await saveMaintenanceProjectObjectBudgetMutation.mutateAsync({
              projectObjectId,
              budgetItems: payload,
            });
          }
        }
      }
    }

    props.onSave?.();
    budget?.refetch();
  }

  const yearlyActuals = trpc.sap.getYearlyActualsByProjectId.useQuery(
    {
      projectId: project.data?.projectId as string,
      startYear: dayjs(project.data?.startDate).year(),
      endYear:
        project.data?.endDate === 'infinity'
          ? dayjs().year() + 5
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
      projectType={project.type}
      fields={
        project.type === 'investmentProject'
          ? [
              'committee',
              'estimate',
              'amount',
              'contractPrice',
              'actual',
              'forecast',
              'kayttosuunnitelmanMuutos',
            ]
          : ['year', 'estimate', 'amount', 'forecast', 'actual', 'kayttosuunnitelmanMuutos']
      }
      {...(project.type === 'investmentProject' && { committees: project.data.committees })}
      budget={budget.data}
      actuals={yearlyActuals.data}
      actualsLoading={yearlyActuals.isFetching}
      writableFields={editable ? props.writableFields : []}
      onSave={handleSaveBudget}
      customTooltips={{
        year:
          project.data.endDate === 'infinity'
            ? tr('budgetTable.yearHelpOngoing')
            : tr('budgetTable.yearHelp'),
      }}
      projectObjects={props.projectObjects}
    />
  );
});
