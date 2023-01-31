import dayjs from 'dayjs';
import { useEffect, useMemo } from 'react';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { getRange } from '@frontend/utils/array';

import { DBProjectObject } from '@shared/schema/projectObject';

import { CostEstimatesTable } from '../Project/CostEstimatesTable';

interface Props {
  projectId: string;
  projectObject: DBProjectObject;
}

export function ProjectObjectFinances(props: Props) {
  const { projectId, projectObject } = props;
  const estimates = !projectObject.id
    ? null
    : trpc.projectObject.getCostEstimates.useQuery({ projectId, id: projectObject.id });

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

  const saveEstimatesMutation = trpc.project.updateCostEstimates.useMutation({
    onSuccess() {
      notify({
        severity: 'success',
        title: tr('costEstimatesTable.notifySave'),
        duration: 5000,
      });
    },
    onError() {
      notify({
        severity: 'error',
        title: tr('costEstimatesTable.notifySaveFailed'),
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

  return !estimates?.data ? null : (
    <CostEstimatesTable
      years={years}
      estimates={estimates.data}
      actuals={yearlyActuals.data}
      actualsLoading={yearlyActuals.isFetching}
      onSave={async (costEstimates) => {
        await saveEstimatesMutation.mutateAsync({
          projectObjectId: projectObject.id,
          costEstimates,
        });
        estimates.refetch();
      }}
    />
  );
}
