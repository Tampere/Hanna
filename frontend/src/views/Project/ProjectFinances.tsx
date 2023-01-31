import dayjs from 'dayjs';
import { useEffect, useMemo } from 'react';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { getRange } from '@frontend/utils/array';

import { DbProject } from '@shared/schema/project';

import { CostEstimatesTable } from './CostEstimatesTable';

interface Props {
  project?: DbProject | null;
}

export function ProjectFinances(props: Props) {
  const { project } = props;
  const estimates = !project ? null : trpc.project.getCostEstimates.useQuery({ id: project.id });
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

  return !estimates?.data || !project ? null : (
    <CostEstimatesTable
      years={projectYears}
      estimates={estimates.data}
      actuals={yearlyActuals.data}
      actualsLoading={yearlyActuals.isFetching}
      onSave={async (costEstimates) => {
        await saveEstimatesMutation.mutateAsync({
          projectId: project.id,
          costEstimates,
        });
        estimates?.refetch();
      }}
    />
  );
}
