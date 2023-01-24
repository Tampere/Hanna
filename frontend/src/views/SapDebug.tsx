import { useParams } from 'react-router';

import { trpc } from '@frontend/client';

export function SapDebugView() {
  const { sapProjectId = '' } = useParams();
  const sapData = trpc.sap.getSapProject.useMutation();

  return (
    <div>
      <h1>SAP Debug</h1>
      <button onClick={() => sapData.mutate({ projectId: sapProjectId })}>Hae</button>
      <pre>{JSON.stringify({ sapProjectId, sapData }, null, 2)}</pre>
    </div>
  );
}
