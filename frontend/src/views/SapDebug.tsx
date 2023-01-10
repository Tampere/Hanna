import { useParams } from 'react-router';

import { trpc } from '@frontend/client';

export function SapDebugView() {
  const { sapProjectId = '' } = useParams();
  const sapData = trpc.project.sapTest.useQuery({ sapProjectId });
  return <pre>{JSON.stringify({ sapProjectId, sapData }, null, 2)}</pre>;
}
