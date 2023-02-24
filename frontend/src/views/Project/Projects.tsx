import { css } from '@emotion/react';
import { AddCircle, Download, NavigateNext } from '@mui/icons-material';
import { Box, Button, Card, CardActionArea, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { AsyncJobIconButton } from '@frontend/components/AsyncJobIconButton';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { getProjectSearchParams } from '@frontend/stores/search/project';
import { useDebounce } from '@frontend/utils/useDebounce';
import { ResultsMap } from '@frontend/views/Project/ResultsMap';

import { DbProject } from '@shared/schema/project';

import { SearchControls } from './SearchControls';

const toolbarContainerStyle = css`
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

function Toolbar() {
  const tr = useTranslations();
  return (
    <Box css={toolbarContainerStyle}>
      <Typography variant="h4">{tr('pages.projectsTitle')}</Typography>
      <div>
        <Button
          component={Link}
          to="/hanke/luo"
          variant="contained"
          size="large"
          style={{ alignItems: 'flex-start' }}
          endIcon={<AddCircle />}
        >
          {tr('newProject.btnLabel')}
        </Button>
      </div>
    </Box>
  );
}

const projectCardStyle = css`
  padding: 16px;
  display: flex;
  align-items: center;
  cursor: pointer;
  :hover {
    background: #eee;
  }
  transition: background 0.5s;
`;

function ProjectCard({ result }: { result: DbProject }) {
  const tr = useTranslations();
  return (
    <CardActionArea key={result.id} component={Link} to={`/hanke/${result.id}`}>
      <Card variant="outlined" css={projectCardStyle}>
        <NavigateNext sx={{ color: '#aaa', mr: 1 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography sx={{ lineHeight: '120%' }} variant="button">
            {result.projectName}
          </Typography>
          <Typography sx={{ lineHeight: '120%' }} variant="overline">
            {dayjs(result.startDate).format(tr('date.format'))} —{' '}
            {dayjs(result.endDate).format(tr('date.format'))}
          </Typography>
        </Box>
      </Card>
    </CardActionArea>
  );
}

interface SearchResultsProps {
  results: readonly DbProject[];
  loading?: boolean;
}

function SearchResults({ results, loading }: SearchResultsProps) {
  const tr = useTranslations();
  const projectSearchParams = getProjectSearchParams();
  const { project } = trpc.useContext();
  const notify = useNotifications();

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
        </Typography>
        <AsyncJobIconButton
          disabled={results?.length < 1}
          tooltip={tr('projectSearch.generateReport')}
          onStart={async () => {
            return await project.startReportJob.fetch(projectSearchParams);
          }}
          getStatus={async (jobId) => {
            const { isFinished, state } = await project.getReportJobStatus.fetch({ jobId });
            if (state === 'failed') {
              return {
                finished: true,
                error: tr('projectSearch.reportFailed'),
              };
            }

            return {
              finished: isFinished,
            };
          }}
          onFinished={async (jobId) => {
            // Create a link element to automatically download the new report
            const link = document.createElement('a');
            link.href = `/api/v1/report/file?id=${jobId}`;
            link.click();
          }}
          onError={(error: string) => {
            notify({
              title: error,
              severity: 'error',
            });
          }}
          icon={<Download />}
          pollingIntervalTimeout={1000}
        />
      </Box>
      {results?.length > 0
        ? results.map((result) => <ProjectCard result={result} key={result.id} />)
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
  const projectSearchParams = getProjectSearchParams();
  const search = trpc.project.search.useQuery({
    ...projectSearchParams,
    map: useDebounce(projectSearchParams.map, 400),
    text: useDebounce(projectSearchParams.text, 250),
  });
  return (
    <div css={resultsContainerStyle}>
      <SearchResults loading={search.isLoading} results={search.data?.projects ?? []} />
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
