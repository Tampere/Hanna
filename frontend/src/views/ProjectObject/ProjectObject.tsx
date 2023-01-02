import { css } from '@emotion/react';
import { useLoaderData } from 'react-router';

import { trpc } from '@frontend/client';

import { ProjectObjectForm } from './ProjectObjectForm';

export function ProjectObject() {
  const params = useLoaderData() as { projectId: string; projectObjectId?: string };
  const projectObjectId = params?.projectObjectId;

  const projectObject = projectObjectId
    ? trpc.projectObject.get.useQuery({
        projectId: params.projectId,
        id: projectObjectId,
      }).data
    : null;

  return (
    <div
      css={css`
        max-width: 400px;
      `}
    >
      <ProjectObjectForm projectId={params.projectId} projectObject={projectObject} />
    </div>
  );
}
