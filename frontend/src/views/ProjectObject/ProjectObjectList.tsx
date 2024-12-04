import { AddCircle, NavigateNext } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  FormControl,
  InputLabel,
  List,
  MenuItem,
  Select,
  Skeleton,
  Typography,
  css,
} from '@mui/material';
import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { langAtom, useTranslations } from '@frontend/stores/lang';
import { ProjectTypePath } from '@frontend/types';

import { DbObjectOrderBy } from '@shared/schema/projectObject';

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

  const [orderBy, setOrderBy] = useState<DbObjectOrderBy>('name');
  const [byYear, setByYear] = useState<number | 'all'>('all');

  const codes = trpc.code.get.useQuery(
    { codeListId: 'KohteenLaji', allowEmptySelection: false },
    { staleTime: Infinity },
  );

  function getObjectStageTextById(objectId: string) {
    return codes?.data?.find((code) => code.id.id === objectId)?.text[lang] ?? '';
  }

  const projectObjects = trpc.projectObject.getByProjectId.useQuery({
    projectId: props.projectId,
    orderBy,
  });

  const objectYears = useMemo(() => {
    if (!projectObjects.data) return [];
    const allYears = projectObjects.data.map((obj) => dayjs(obj.startDate).year());
    return allYears.filter((year, index) => allYears.indexOf(year) === index).sort((a, b) => a - b);
  }, [projectObjects.data]);

  return (
    <Box>
      <Box
        css={css`
          position: sticky;
          top: 0;
          z-index: 1;
          background-color: white;
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          align-items: center;
          height: 80px;
        `}
      >
        <FormControl size="small">
          <InputLabel
            css={css`
              background-color: white;
            `}
            id="project-object-year-select-label"
          >
            {tr('projectObjectList.filterByStartYearLabel')}
          </InputLabel>
          <Select
            css={css`
              width: 200px;
            `}
            labelId="project-object-year-select-label"
            value={byYear}
            onChange={(e) => {
              if (e.target.value === 'all') {
                setByYear('all');
              } else {
                setByYear(Number(e.target.value));
              }
            }}
          >
            <MenuItem value={'all'}>{tr('projectObjectList.allYears')}</MenuItem>
            {objectYears.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl
          size="small"
          css={css`
            margin-right: auto;
          `}
        >
          <InputLabel
            css={css`
              background-color: white;
            `}
            id="project-object-order-label"
          >
            {tr('projectObjectList.orderByLabel')}
          </InputLabel>
          <Select
            css={css`
              width: 200px;
            `}
            labelId="project-object-order-label"
            value={orderBy}
            onChange={(e) => setOrderBy(e.target.value as DbObjectOrderBy)}
          >
            <MenuItem value={'name'}>{tr('projectObjectList.orderByName')}</MenuItem>
            <MenuItem value={'startDate'}>{tr('projectObjectList.orderByStartDate')}</MenuItem>
            <MenuItem value={'endDate'}>{tr('projectObjectList.orderByEndDate')}</MenuItem>
            <MenuItem value={'createdAt'}>{tr('projectObjectList.orderByCreatedAt')}</MenuItem>
          </Select>
        </FormControl>
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
      {projectObjects.isLoading ? (
        <Box
          css={css`
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-top: 1rem;
          `}
        >
          <Skeleton variant="rectangular" animation="wave" height={68} />
          <Skeleton variant="rectangular" animation="wave" height={68} />
        </Box>
      ) : projectObjects.data?.length === 0 ? (
        <span>{tr('projectObjectList.noProjectObjects')}</span>
      ) : (
        <List>
          {projectObjects.data
            ?.filter((obj) => byYear === 'all' || dayjs(obj.startDate).year() === byYear)
            .map((projObj) => (
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
                      {projObj.endDate !== 'infinity' &&
                        dayjs(projObj.endDate).format(tr('date.format'))}
                    </Typography>
                    {props.projectType === 'investointihanke' && (
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
                    )}
                  </Box>
                </Card>
              </CardActionArea>
            ))}
        </List>
      )}
    </Box>
  );
}
