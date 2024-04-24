import { css } from '@emotion/react';
import { Add, AddCircle, Download, NavigateNext } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { AsyncJobButton } from '@frontend/components/AsyncJobButton';
import { useNotifications } from '@frontend/services/notification';
import { asyncUserAtom } from '@frontend/stores/auth';
import { useTranslations } from '@frontend/stores/lang';
import { activeProjectIdAtom } from '@frontend/stores/map';
import { projectSearchParamAtom } from '@frontend/stores/search/project';
import { useDebounce } from '@frontend/utils/useDebounce';
import { ResultsMap } from '@frontend/views/Project/ResultsMap';

import { DbProject } from '@shared/schema/project/base';
import { hasPermission } from '@shared/schema/userPermissions';

import { SearchControls } from './SearchControls';

const toolbarContainerStyle = css`
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

function Toolbar() {
  const tr = useTranslations();
  const auth = useAtomValue(asyncUserAtom);
  const [newProjectMenuOpen, setNewProjectMenuOpen] = useState(false);
  const newProjectMenuAnchor = useRef<HTMLButtonElement>(null);

  const canCreateProject =
    auth &&
    (hasPermission(auth, 'investmentProject.write') ||
      hasPermission(auth, 'detailplanProject.write'));

  return (
    <Box css={toolbarContainerStyle}>
      <Typography variant="h4" component="h1">
        {tr('pages.projectsTitle')}
      </Typography>
      <div>
        <Button
          ref={newProjectMenuAnchor}
          onClick={() => setNewProjectMenuOpen(true)}
          disabled={!canCreateProject}
          variant="contained"
          size="large"
          style={{ alignItems: 'flex-start' }}
          endIcon={<AddCircle />}
        >
          {tr('newProject.btnLabel')}
        </Button>
        <Menu
          open={newProjectMenuOpen}
          onClose={() => setNewProjectMenuOpen(false)}
          anchorEl={newProjectMenuAnchor.current}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          {auth && hasPermission(auth, 'investmentProject.write') && (
            <MenuItem component={Link} to="/investointihanke/luo">
              <ListItemIcon>
                <Add />
              </ListItemIcon>
              <ListItemText>{tr('newProject.newInvestmentProject')}</ListItemText>
            </MenuItem>
          )}
          {auth && hasPermission(auth, 'detailplanProject.write') && (
            <MenuItem component={Link} to="/asemakaavahanke/luo">
              <ListItemIcon>
                <Add />
              </ListItemIcon>
              <ListItemText>{tr('newProject.newDetailplanProject')}</ListItemText>
            </MenuItem>
          )}
        </Menu>
      </div>
    </Box>
  );
}

const projectCardStyle = (highlighted: boolean) => css`
  padding: 16px;
  display: flex;
  align-items: center;
  cursor: pointer;
  background: ${highlighted ? '#e7eef9' : '#fff'};
  :hover {
    background: #eee;
  }
  transition: background 0.5s;
  position: relative;
`;

const projectTypeRootUrl = {
  detailplanProject: '/asemakaavahanke',
  investmentProject: '/investointihanke',
};

function ProjectCard({ result, highlighted }: { result: DbProject; highlighted: boolean }) {
  const tr = useTranslations();
  const projectUrl = `${projectTypeRootUrl[result.projectType]}/${result.projectId}`;

  return (
    <CardActionArea
      id={`project-${result.projectId}`}
      key={result.projectId}
      component={Link}
      to={projectUrl}
    >
      <Card variant="outlined" css={projectCardStyle(highlighted)}>
        <NavigateNext sx={{ color: '#aaa', mr: 1 }} />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Typography sx={{ lineHeight: '120%' }} variant="button">
            {result.projectName}
            {result.detailplanId && (
              <>
                ,{' '}
                <span
                  css={css`
                    color: #aaa;
                  `}
                >
                  ({result.detailplanId})
                </span>
              </>
            )}
          </Typography>
          <Typography sx={{ lineHeight: '120%' }} variant="overline">
            {dayjs(result.startDate).format(tr('date.format'))} –{' '}
            {dayjs(result.endDate).format(tr('date.format'))}
          </Typography>
        </Box>

        <span
          css={css`
            position: absolute;
            padding: 2px 6px;
            bottom: 6px;
            right: 6px;
            font-size: x-small;
            font-weight: 300;
            border: 1px solid #ddd;
            color: #333;
            border-radius: 8px;
          `}
        >
          {tr(`projectType.${result.projectType}.short`)}
        </span>
      </Card>
    </CardActionArea>
  );
}

interface SearchResultsProps {
  results: readonly DbProject[];
  loading?: boolean;
  activeProjectId: string | null;
}

function SearchResults({ results, loading, activeProjectId }: SearchResultsProps) {
  const tr = useTranslations();
  const projectSearchParams = useAtomValue(projectSearchParamAtom);
  const { project } = trpc.useUtils();
  const notify = useNotifications();

  useEffect(() => {
    const activeProjectCard = document.getElementById(`project-${activeProjectId}`);

    if (activeProjectCard) {
      activeProjectCard.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeProjectId]);

  return (
    <Box
      aria-label={tr('projectListing.searchResultsTitle')}
      css={css`
        display: flex;
        flex-direction: column;
        gap: 8px;
        overflow: auto;
        min-width: 256px;
      `}
    >
      <Box
        css={css`
          display: flex;
          flex-direction: row;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 1;
          background: #fff;
        `}
      >
        <Typography
          variant="h5"
          css={css`
            flex-grow: 1;
          `}
        >
          {tr('projectListing.searchResultsTitle')}
          {!loading && (
            <Chip label={results?.length ?? 0} sx={{ ml: 1 }} size="small" variant="outlined" />
          )}
        </Typography>
        <AsyncJobButton
          endIcon={<Download />}
          disabled={results?.length < 1}
          onStart={async () => {
            return await project.startReportJob.fetch(projectSearchParams);
          }}
          onFinished={async (jobId) => {
            // Create a link element to automatically download the new report
            const link = document.createElement('a');
            link.href = `/api/v1/report/file?id=${jobId}`;
            link.click();
          }}
          onError={() => {
            notify({
              title: tr('projectSearch.reportFailed'),
              severity: 'error',
            });
          }}
          pollingIntervalMs={1000}
        >
          {tr('projectSearch.generateReport')}
        </AsyncJobButton>
      </Box>
      {results?.length > 0
        ? results.map((result) => (
            <ProjectCard
              result={result}
              key={result.projectId}
              highlighted={result.projectId === activeProjectId}
            />
          ))
        : !loading && (
            <Box>
              <p>{tr('projectSearch.noResults')}</p>
            </Box>
          )}
    </Box>
  );
}

const resultsContainerStyle = css`
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1fr 2fr;
  grid-gap: 16px;
  overflow: auto;
  flex: 1;
`;

function ProjectResults() {
  const projectSearchParams = useAtomValue(projectSearchParamAtom);
  const activeProjectId = useAtomValue(activeProjectIdAtom);
  const search = trpc.project.search.useQuery({
    ...projectSearchParams,
    map: useDebounce(projectSearchParams.map, 400),
    text: useDebounce(projectSearchParams.text, 250),
  });
  return (
    <div css={resultsContainerStyle}>
      <SearchResults
        loading={search.isLoading}
        results={search.data?.projects ?? []}
        activeProjectId={activeProjectId}
      />
      <ResultsMap loading={search.isLoading} results={search.data} />
    </div>
  );
}

const projectPageStyle = css`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

export function ProjectsPage() {
  return (
    <Box css={projectPageStyle}>
      <Toolbar />
      <SearchControls />
      <ProjectResults />
    </Box>
  );
}
