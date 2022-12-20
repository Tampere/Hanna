import { trpc } from '@frontend/client';

import { DbProject } from '@shared/schema/project';

import { CostEstimatesTable } from './CostEstimatesTable';

interface Props {
  project?: DbProject | null;
}

export function ProjectFinances(props: Props) {
  const { project } = props;
  const estimates = !project ? null : trpc.project.getCostEstimates.useQuery({ id: project.id });
  return !estimates?.data ? null : (
    <CostEstimatesTable
      project={project}
      estimates={estimates.data}
      onSaved={() => {
        estimates?.refetch();
      }}
    />
  );
}
