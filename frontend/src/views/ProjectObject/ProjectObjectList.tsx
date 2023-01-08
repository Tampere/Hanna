import { AddCircle, NavigateNext } from '@mui/icons-material';
import { Box, Button, Card, CardActionArea, List, ListItem, Typography, css } from '@mui/material';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { useTranslations } from '@frontend/stores/lang';

interface Props {
  projectId: string;
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
          to={`/hanke/${props.projectId}/uusi-kohde`}
          variant="contained"
          color="primary"
          size="small"
          endIcon={<AddCircle />}
        >
          Luo uusi kohde
        </Button>
      </Box>
      {projObjects.data?.length === 0 ? (
        <span>{tr('project.noProjectObjects')}</span>
      ) : (
        <List>
          {projObjects.data?.map((projObj) => (
            <CardActionArea
              key={projObj.id}
              component={Link}
              to={`/hanke/${props.projectId}/kohde/${projObj.id}`}
            >
              <Card variant="outlined" css={cardStyle}>
                <NavigateNext sx={{ color: '#aaa', mr: 1 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography sx={{ lineHeight: '120%' }} variant="button">
                    {projObj.objectName}
                  </Typography>
                  <Typography sx={{ lineHeight: '120%' }} variant="overline">
                    {dayjs(projObj.startDate).format(tr('date.format'))} —{' '}
                    {dayjs(projObj.endDate).format(tr('date.format'))}
                  </Typography>
                </Box>
              </Card>
            </CardActionArea>
          ))}
        </List>
      )}
    </Box>
  );
}
