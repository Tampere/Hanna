import { css } from '@emotion/react';
import { useState } from 'react';
import { useParams } from 'react-router';

import { trpc } from '@frontend/client';

const preStyle = css`
  background: black;
  color: white;
  padding: 5px;
  font-size: 13px;
  overflow-y: scroll;
  height: 100%;
`;
export function SapDebugView() {
  const { sapProjectId = '' } = useParams();
  const sapProjectData = trpc.sap.getSapProject.useMutation();
  const sapActualsData = trpc.sap.getSapActuals.useMutation();

  const [actualsYear, setActualsYear] = useState('2023');

  return (
    <div>
      <h1>SAP Debug</h1>
      <div
        css={css`
          display: grid;
          grid-gap: 8px;
          grid-template-columns: 1fr 1fr;
        `}
      >
        <div>
          <button onClick={() => sapProjectData.mutate({ projectId: sapProjectId })}>
            Hae rakenne
          </button>
          <pre css={preStyle}>
            {JSON.stringify({ sapProjectId, sapData: sapProjectData }, null, 2)}
          </pre>
        </div>

        <div>
          <select value={actualsYear} onChange={(e) => setActualsYear(e.target.value)}>
            <option value="2019">2019</option>
            <option value="2020">2020</option>
            <option value="2021">2021</option>
            <option value="2022">2022</option>
            <option value="2023">2023</option>
          </select>
          <button
            onClick={() => sapActualsData.mutate({ projectId: sapProjectId, year: actualsYear })}
          >
            Hae tapahtumat
          </button>
          <pre css={preStyle}>
            {JSON.stringify({ sapProjectId, sapData: sapActualsData }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
