import dayjs from 'dayjs';
import { forwardRef, useEffect, useMemo } from 'react';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { getRange } from '@frontend/utils/array';

import { ProjectType } from '@shared/schema/project/type';
import { CommonDbProjectObject } from '@shared/schema/projectObject/base';

import { BudgetFields, BudgetTable } from '../Project/BudgetTable';

interface Props<TProjectObject extends CommonDbProjectObject> {
  projectObject: { projectType: Omit<ProjectType, 'detailplanProject'>; data: TProjectObject };
  userIsFinanceEditor?: boolean;
  userIsEditor?: boolean;
  userCanWrite?: boolean;
  userIsAdmin?: boolean;
  onSave?: () => void;
}

export const ProjectObjectFinances = forwardRef(function ProjectObjectFinances<
  TProjectObject extends CommonDbProjectObject,
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
        ? startYear + 5
        : dayjs(projectObject.data.endDate).get('year');
    return getRange(startYear, endYear);
  }, [projectObject.data?.startDate, projectObject.data?.endDate]);

  const saveBudgetMutation = trpc[
    projectObject.projectType === 'investmentProject'
      ? 'investmentProjectObject'
      : 'maintenanceProjectObject'
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

  function getWritableFields(): BudgetFields[] {
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
          ? dayjs(projectObject.data?.startDate).year() + 5
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
      actuals={yearlyActuals.data}
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
      onSave={async (yearBudgets) => {
        const payload = yearBudgets.map((yearBudget) => ({
          year: yearBudget.year,
          estimate: yearBudget.budgetItems.estimate ?? null,
          contractPrice: yearBudget.budgetItems.contractPrice ?? null,
          amount: yearBudget.budgetItems.amount,
          forecast: yearBudget.budgetItems?.forecast ?? null,
          kayttosuunnitelmanMuutos: yearBudget.budgetItems.kayttosuunnitelmanMuutos ?? null,
        }));
        await saveBudgetMutation.mutateAsync({
          projectObjectId: projectObject.data.projectObjectId,
          budgetItems: payload,
        });
        budget.refetch();
        props.onSave?.();
      }}
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
