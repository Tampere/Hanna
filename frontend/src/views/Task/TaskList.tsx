import { NavigateNext } from '@mui/icons-material';
import { Box, Card, CardActionArea, List, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { useTranslations } from '@frontend/stores/lang';

interface Props {
  projectObjectId: string;
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

export function TaskList({ projectObjectId }: Props) {
  const tr = useTranslations();

  /** Fetch tasks on component mount */
  const projectObjectTasks = trpc.task.getByProjectObjectId.useQuery({ projectObjectId });

  return (
    // <Box>
    //   {projectObjectTasks.data?.length === 0 ? (
    //     <span>{tr('projectObject.noTasks')}</span>
    //   ) : (
    //     <Box>
    //       ToDo: taulukoidaan tehtävät
    //       {projectObjectTasks.data?.map((task) => (
    //         <pre>{JSON.stringify(task, null, 2)}</pre>
    //       ))}
    //     </Box>
    //   )}
    // </Box>
    <Box>
      {projectObjectTasks.data?.length === 0 ? (
        <span>{tr('projectObject.noTasks')}</span>
      ) : (
        <List>
          {projectObjectTasks.data?.map((task) => (
            <CardActionArea key={task.id} component={Link} to={`#`}>
              <Card variant="outlined" css={cardStyle}>
                <NavigateNext sx={{ color: '#aaa', mr: 1 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography sx={{ lineHeight: '120%' }} variant="button">
                    {task.taskName}
                  </Typography>
                  <Typography sx={{ lineHeight: '120%' }} variant="overline">
                    {dayjs(task.startDate).format(tr('date.format'))} —{' '}
                    {dayjs(task.endDate).format(tr('date.format'))}
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
