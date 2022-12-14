import { css } from '@emotion/react';
import { AddCircle, NavigateNext } from '@mui/icons-material';
import { Box, Button, Card, CardActionArea, Paper, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

import { trpc } from '@frontend/client';
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

const searchResultContainerStyle = css`
  min-width: 256px;
  padding: 16px;
`;

interface SearchResultsProps {
  results: readonly DbProject[];
  loading?: boolean;
}

function SearchResults({ results, loading }: SearchResultsProps) {
  const tr = useTranslations();
  return (
    <Paper css={searchResultContainerStyle} elevation={1}>
      <Typography variant="h5">{tr('projectListing.searchResultsTitle')}</Typography>
      {results?.length > 0 ? (
        <Box>
          {results.map((result) => {
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
          })}
        </Box>
      ) : (
        !loading && (
          <Box>
            <span>{tr('projectSearch.noResults')}</span>
          </Box>
        )
      )}
    </Paper>
  );
}

const resultsContainerStyle = css`
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 16px;
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
  display: flex;
  flex-direction: column;
  height: 100%;
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
