import dayjs from 'dayjs';
import { useEffect, useMemo } from 'react';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { getRange } from '@frontend/utils/array';

import { DBProjectObject } from '@shared/schema/projectObject';

import { BudgetFields, BudgetTable } from '../Project/BudgetTable';

interface Props {
  projectObject: DBProjectObject;
  userCanEditFinances?: boolean;
  userIsEditor?: boolean;
  userCanWrite?: boolean;
  userIsAdmin?: boolean;
}

export function ProjectObjectFinances(props: Props) {
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
      return ['amount', 'forecast', 'kayttosuunnitelmanMuutos'];
    } else if (props.userCanEditFinances) {
      if (props.userIsEditor) return ['amount', 'kayttosuunnitelmanMuutos', 'forecast'];
      return ['amount', 'kayttosuunnitelmanMuutos'];
    } else if (props.userIsEditor) {
      return ['forecast'];
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
      writableFields={getWritableFields()}
      onSave={async (yearBudgets) => {
        const payload = yearBudgets.map((yearBudget) => ({
          year: yearBudget.year,
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
