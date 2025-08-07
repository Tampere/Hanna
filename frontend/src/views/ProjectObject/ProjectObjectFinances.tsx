import dayjs from 'dayjs';
import { forwardRef, useEffect, useMemo } from 'react';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { getRange } from '@frontend/utils/array';

import { ProjectYearBudget } from '@shared/schema/project';
import { ProjectType } from '@shared/schema/project/type';
import { CommonDbProjectObject } from '@shared/schema/projectObject/base';

import { BudgetField, BudgetTable } from '../ProjectObject/BudgetTable';

interface Props<TProjectObject extends CommonDbProjectObject & { committee?: string }> {
  projectObject: { projectType: Omit<ProjectType, 'detailplanProject'>; data: TProjectObject };
  userIsFinanceEditor?: boolean;
  userIsEditor?: boolean;
  userCanWrite?: boolean;
  userIsAdmin?: boolean;
  onSave?: () => void;
}

export const ProjectObjectFinances = forwardRef(function ProjectObjectFinances<
  TProjectObject extends CommonDbProjectObject & { committee?: string },
>(props: Props<TProjectObject>, ref: React.ForwardedRef<unknown>) {
  const { projectObject } = props;
  const budget = !projectObject.data.projectObjectId
    ? null
    : trpc.projectObject.getBudget.useQuery({
        projectObjectId: projectObject.data.projectObjectId,
      });

  const notify = useNotifications();
  const tr = useTranslations();

  const years = useMemo(() => {
    if (!projectObject.data?.startDate || !projectObject.data?.endDate) {
      return [];
    }
    const startYear = dayjs(projectObject.data.startDate).get('year');
    const endYear =
      projectObject.data.endDate === 'infinity'
        ? Math.max(dayjs().year() + 5, dayjs(projectObject.data.startDate).get('year') + 5)
        : dayjs(projectObject.data.endDate).get('year');
    return getRange(startYear, endYear);
  }, [projectObject.data?.startDate, projectObject.data?.endDate]);

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
    trpc.investmentProjectObject.updateBudget.useMutation(saveBudgetMutationOptions);
  const saveMaintenanceBudgetMutation =
    trpc.maintenanceProjectObject.updateBudget.useMutation(saveBudgetMutationOptions);

  async function handleSaveBudget(yearBudgets: ProjectYearBudget[]) {
    if (projectObject.data) {
      // for typescript to know that project.data is not null or undefined
      if (projectObject.projectType === 'investmentProject') {
        type InvestmentProjectBudget = ProjectYearBudget['budgetItems'] & {
          year: number;
          committee: string;
        };
        const payload = yearBudgets
          .map((yearBudget) => ({
            ...yearBudget.budgetItems,
            year: yearBudget.year,
            committee: projectObject.data.committee,
          }))
          .filter<InvestmentProjectBudget>((item): item is InvestmentProjectBudget =>
            Boolean(item.committee),
          );

        await saveInvestmentBudgetMutation.mutateAsync({
          projectObjectId: projectObject.data.projectObjectId as string,
          budgetItems: payload,
        });
      } else {
        type MaintenanceProjectBudget = ProjectYearBudget['budgetItems'] & {
          year: number;
          committee: null;
        };
        const payload = yearBudgets
          .map((yearBudget) => ({
            ...yearBudget.budgetItems,
            year: yearBudget.year,
            committee: null,
          }))
          .filter<MaintenanceProjectBudget>((item): item is MaintenanceProjectBudget =>
            Boolean(item),
          );
        await saveMaintenanceBudgetMutation.mutateAsync({
          projectObjectId: projectObject.data.projectObjectId as string,
          budgetItems: payload,
        });
      }
    }
    props.onSave?.();
    budget?.refetch();
  }

  function getWritableFields(): BudgetField[] {
    if (props.userIsAdmin) {
      return ['estimate', 'contractPrice', 'amount', 'forecast', 'kayttosuunnitelmanMuutos'];
    } else if (props.userIsEditor) {
      if (props.userIsFinanceEditor) {
        return ['estimate', 'contractPrice', 'amount', 'forecast', 'kayttosuunnitelmanMuutos'];
      }
      return ['estimate', 'contractPrice', 'forecast'];
    } else if (props.userIsFinanceEditor) {
      return ['amount', 'kayttosuunnitelmanMuutos'];
    } else {
      return [];
    }
  }

  const yearlyActuals = trpc.sap.getYearlyActualsByProjectObjectId.useQuery(
    {
      projectObjectId: projectObject.data.projectObjectId,
      startYear: dayjs(projectObject.data?.startDate).year(),
      endYear:
        projectObject.data?.endDate === 'infinity'
          ? dayjs().year() + 5
          : dayjs(projectObject.data?.endDate).year(),
    },
    { enabled: Boolean(projectObject.data?.projectObjectId) },
  );

  useEffect(() => {
    yearlyActuals.refetch();
  }, [projectObject.data?.sapWBSId]);

  return !budget?.data ? null : (
    <BudgetTable
      ref={ref}
      years={years}
      budget={budget.data}
      actuals={yearlyActuals?.data === null ? undefined : yearlyActuals?.data}
      actualsLoading={yearlyActuals.isFetching}
      fields={[
        'estimate',
        'contractPrice',
        'amount',
        'forecast',
        'kayttosuunnitelmanMuutos',
        'actual',
      ]}
      writableFields={getWritableFields()}
      onSave={handleSaveBudget}
      customTooltips={{
        estimate: tr('budgetTable.projectObjectEstimateHelp'),
        year:
          projectObject.data.endDate === 'infinity'
            ? tr('budgetTable.yearHelpOngoingObject')
            : tr('budgetTable.yearHelp'),
      }}
    />
  );
});
