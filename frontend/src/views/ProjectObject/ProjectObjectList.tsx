import { AddCircle, NavigateNext } from '@mui/icons-material';
import { Box, Button, Card, CardActionArea, List, Typography, css } from '@mui/material';
import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import { Link } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { langAtom, useTranslations } from '@frontend/stores/lang';
import { ProjectTypePath } from '@frontend/types';

interface Props {
  projectId: string;
  projectType: ProjectTypePath;
  editable?: boolean;
}

const cardStyle = css`
  margin-top: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  cursor: pointer;
  :hover {
    background: #eee;
  }
  transition: background 0.5s;
`;

export function ProjectObjectList(props: Props) {
  const tr = useTranslations();
  const lang = useAtomValue(langAtom);
  const codes = trpc.code.get.useQuery(
    { codeListId: 'KohteenLaji', allowEmptySelection: false },
    { staleTime: Infinity },
  );

  function getObjectStageTextById(objectId: string) {
    return codes?.data?.find((code) => code.id.id === objectId)?.text[lang] ?? '';
  }

  const projObjects = trpc.projectObject.getByProjectId.useQuery({ projectId: props.projectId });

  return (
    <Box>
      <Box
        css={css`
          display: flex;
          justify-content: flex-end;
        `}
      >
        <Button
          component={Link}
          disabled={!props.editable}
          to={`/${props.projectType}/${props.projectId}/uusi-kohde`}
          variant="contained"
          color="primary"
          size="small"
          endIcon={<AddCircle />}
        >
          {tr('projectObject.createNewBtnLabel')}
        </Button>
      </Box>
      {projObjects.data?.length === 0 ? (
        <span>{tr('project.noProjectObjects')}</span>
      ) : (
        <List>
          {projObjects.data?.map((projObj) => (
            <CardActionArea
              key={projObj.projectObjectId}
              component={Link}
              to={`/${props.projectType}/${props.projectId}/kohde/${projObj.projectObjectId}`}
            >
              <Card variant="outlined" css={cardStyle}>
                <NavigateNext sx={{ color: '#aaa', mr: 1 }} />
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.15rem',
                  }}
                >
                  <Typography sx={{ lineHeight: '120%' }} variant="button">
                    {projObj.objectName}
                  </Typography>

                  <Typography sx={{ lineHeight: '120%' }} variant="overline">
                    {dayjs(projObj.startDate).format(tr('date.format'))} —{' '}
                    {dayjs(projObj.endDate).format(tr('date.format'))}
                  </Typography>
                  <span
                    css={css`
                      padding: 2px 6px;
                      font-size: x-small;
                      font-weight: 500;
                      color: #333;
                      border-radius: 8px;
                      background-color: ${projObj.objectStage === '01' ? '#91c9ea' : '#f1eeeb'};
                      position: absolute;
                      bottom: 0.5rem;
                      right: 1rem;
                    `}
                  >
                    {getObjectStageTextById(projObj.objectStage)}
                  </span>
                </Box>
              </Card>
            </CardActionArea>
          ))}
        </List>
      )}
    </Box>
  );
}
