import { Alert, Box, CircularProgress, css } from '@mui/material';
import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';

import { trpc } from '@frontend/client';
import { langAtom, useTranslations } from '@frontend/stores/lang';
import { useCodes } from '@frontend/utils/codes';

import { ProjectData } from '../MapWrapper';

interface ProjectDetailsProps<TProject> {
  project: TProject;
}

export function ProjectDetails<TProject extends ProjectData>({
  project,
}: ProjectDetailsProps<TProject>) {
  const lang = useAtomValue(langAtom);
  const tr = useTranslations();

  const users = trpc.user.getAllNonExt.useQuery();

  function getUser(userId: string) {
    return users.data?.find((user) => user.id === userId);
  }

  const projectDetails =
    project.projectType === 'investmentProject'
      ? trpc.investmentProject.get.useQuery({ projectId: project.projectId })
      : project.projectType === 'maintenanceProject'
        ? trpc.maintenanceProject.get.useQuery({ projectId: project.projectId })
        : trpc.detailplanProject.get.useQuery({ projectId: project.projectId });

  const lifecycleStateCodes = useCodes('KohteenElinkaarentila');
  const committeeCodes = useCodes('Lautakunta');

  if (projectDetails.isLoading || projectDetails.isError) {
    return (
      <Box
        css={css`
          width: 100%;
          height: 90px;
          margin: 12px 0;
          display: flex;
          align-items: center;
          justify-content: center;
        `}
      >
        {projectDetails.isLoading && <CircularProgress />}
        {projectDetails.isError && (
          <Alert severity="error" variant="outlined">
            {tr('genericError')}
          </Alert>
        )}
      </Box>
    );
  }

  return (
    <dl
      css={css`
        width: 270px;
        display: grid;
        column-gap: 0.5rem;
        grid-template-columns: 1fr 2fr;
        font-size: 0.75rem;
        margin: 0;
        padding: 0;
        & dt {
          grid-column: 1;
          font-weight: bold;
          color: #777777;
        }
        & dd {
          grid-column: 2;
          justify-self: start;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 0;
        }
      `}
    >
      <dt>{tr('itemInfoBox.dateRange')}: &nbsp;</dt>
      <dd>
        {dayjs(projectDetails.data.startDate).format(tr('date.format'))} –{' '}
        {projectDetails.data.endDate !== 'infinity' &&
          dayjs(projectDetails.data.endDate).format(tr('date.format'))}
      </dd>
      <dt>{tr('itemInfoBox.lifecycleState')}:</dt>
      <dd>{lifecycleStateCodes.get(projectDetails.data.lifecycleState)?.[lang]}</dd>
      <dt>{tr('itemInfoBox.owner')}:</dt>
      <dd>{getUser(projectDetails.data.owner)?.name}</dd>
      <dt>{tr('itemInfoBox.projectType')}:</dt>
      <dd>{tr(`projectType.${project.projectType}.short`)}</dd>

      {['investmentProject', 'maintenanceProject'].includes(project.projectType) && (
        <>
          <dt>{tr('itemInfoBox.committee')}:</dt>
          <dd>{committeeCodes.get(projectDetails.data.committees[0])?.[lang]}</dd>
        </>
      )}
    </dl>
  );
}
