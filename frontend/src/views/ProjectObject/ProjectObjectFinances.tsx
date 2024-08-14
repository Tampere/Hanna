import dayjs from 'dayjs';
import { useEffect, useMemo } from 'react';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { getRange } from '@frontend/utils/array';

import { CommonDbProjectObject } from '@shared/schema/projectObject/base';

import { BudgetFields, BudgetTable } from '../Project/BudgetTable';

interface Props<TProjectObject extends CommonDbProjectObject> {
  projectObject: TProjectObject;
  userCanEditFinances?: boolean;
  userIsEditor?: boolean;
  userCanWrite?: boolean;
  userIsAdmin?: boolean;
}

export function ProjectObjectFinances<TProjectObject extends CommonDbProjectObject>(
  props: Props<TProjectObject>,
) {
  const { projectObject } = props;
  const budget = !projectObject.projectObjectId
    ? null
    : trpc.projectObject.getBudget.useQuery({ projectObjectId: projectObject.projectObjectId });

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

  const saveBudgetMutation = trpc.projectObject.updateBudget.useMutation({
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
    } else if (props.userCanEditFinances) {
      if (props.userIsEditor)
        return ['estimate', 'contractPrice', 'amount', 'kayttosuunnitelmanMuutos', 'forecast'];
      return ['estimate', 'amount', 'contractPrice', 'kayttosuunnitelmanMuutos'];
    } else if (props.userIsEditor) {
      return ['estimate', 'contractPrice', 'forecast'];
    } else {
      return [];
    }
  }

  const yearlyActuals = trpc.sap.getYearlyActualsByProjectObjectId.useQuery(
    {
      projectObjectId: projectObject.projectObjectId,
      startYear: dayjs(projectObject?.startDate).year(),
      endYear: dayjs(projectObject?.endDate).year(),
    },
    { enabled: Boolean(projectObject?.projectObjectId) },
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
          projectObjectId: projectObject.projectObjectId,
          budgetItems: payload,
        });
        budget.refetch();
      }}
    />
  );
}
