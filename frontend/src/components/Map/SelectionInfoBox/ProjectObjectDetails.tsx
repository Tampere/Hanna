import { Alert, Box, css } from '@mui/material';
import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';

import { langAtom, useTranslations } from '@frontend/stores/lang';
import { useCodes } from '@frontend/utils/codes';

import { ProjectObjectData } from '../MapWrapper';

interface ProjectDetailsProps<TProjectObject> {
  projectObject: TProjectObject;
}

export function ProjectObjectDetails<TProjectObject extends ProjectObjectData>({
  projectObject,
}: ProjectDetailsProps<TProjectObject>) {
  const lang = useAtomValue(langAtom);
  const tr = useTranslations();

  const objectStageCodes = useCodes('KohteenLaji');

  if (!projectObject) {
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
        <Alert severity="error" variant="outlined">
          {tr('genericError')}
        </Alert>
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
          margin: 0;
        }
        & .long {
          max-width: 170px;
        }
      `}
    >
      <dt>{tr('itemInfoBox.dateRange')}:</dt>
      <dd>
        {dayjs(projectObject.startDate).format(tr('date.format'))} –{' '}
        {projectObject.endDate !== 'infinity' &&
          dayjs(projectObject.endDate).format(tr('date.format'))}
      </dd>
      {projectObject.objectStage && (
        <>
          <dt>{tr('itemInfoBox.objectStage')}:</dt>
          <dd>{objectStageCodes.get(projectObject.objectStage)?.[lang]}</dd>
        </>
      )}
      <dt>{tr('itemInfoBox.projectName')}:</dt>
      <dd
        css={css`
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        `}
        title={projectObject.project.projectName}
        className="long"
      >
        {projectObject.project.projectName}
      </dd>
      <dt>{tr('itemInfoBox.projectType')}:</dt>
      <dd>
        {projectObject.project.projectType &&
          tr(`projectType.${projectObject.project.projectType}.short`)}
      </dd>
    </dl>
  );
}
