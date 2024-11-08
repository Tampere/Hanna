import { css } from '@emotion/react';
import { Add, AddCircle, NavigateNext } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Skeleton,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { AsyncJobButton } from '@frontend/components/AsyncJobButton';
import { FileDownload } from '@frontend/components/icons/FileDownload';
import { useNotifications } from '@frontend/services/notification';
import { asyncUserAtom } from '@frontend/stores/auth';
import { useTranslations } from '@frontend/stores/lang';
import { activeItemIdAtom } from '@frontend/stores/map';
import { projectSearchParamAtom } from '@frontend/stores/search/project';
import { useMapInfoBox } from '@frontend/stores/useMapInfoBox';
import { useDebounce } from '@frontend/utils/useDebounce';
import { ResultsMap } from '@frontend/views/Project/ResultsMap';

import { ProjectSearchResult } from '@shared/schema/project';
import { hasPermission } from '@shared/schema/userPermissions';

import { SearchControls } from './SearchControls';

const toolbarContainerStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export function Toolbar() {
  const tr = useTranslations();
  const auth = useAtomValue(asyncUserAtom);

  const [newProjectMenuOpen, setNewProjectMenuOpen] = useState(false);
  const newProjectMenuAnchor = useRef<HTMLButtonElement>(null);

  const canCreateProject =
    auth &&
    (hasPermission(auth, 'investmentProject.write') ||
      hasPermission(auth, 'detailplanProject.write') ||
      hasPermission(auth, 'maintenanceProject.write'));
  return (
    <Box css={toolbarContainerStyle} className="toolbar-container">
      <div>
        <Button
          ref={newProjectMenuAnchor}
          onClick={() => setNewProjectMenuOpen(true)}
          disabled={!canCreateProject}
          variant="contained"
          size="medium"
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
          {auth && hasPermission(auth, 'maintenanceProject.write') && (
            <MenuItem component={Link} to="/kunnossapitohanke/luo">
              <ListItemIcon>
                <Add />
              </ListItemIcon>
              <ListItemText>{tr('newProject.newMaintenanceProject')}</ListItemText>
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
  padding: 12px;
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
  maintenanceProject: '/kunnossapitohanke',
};

function ProjectCard({
  result,
  highlighted,
}: {
  result: ProjectSearchResult['projects'][number];
  highlighted: boolean;
}) {
  const tr = useTranslations();
  const { resetInfoBox } = useMapInfoBox();
  const projectUrl = `${projectTypeRootUrl[result.projectType]}/${result.projectId}`;

  return (
    <CardActionArea
      onClick={() => resetInfoBox()}
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
            {result.endDate !== 'infinity' && dayjs(result.endDate).format(tr('date.format'))}
          </Typography>
        </Box>

        <span
          css={css`
            margin-left: auto;
            align-self: center;
            padding: 2px 6px;
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

function ProjectCardSkeleton({ count = 1 }: { count: number }) {
  return (
    <Box
      css={css`
        animation: fadeIn 1s ease-in-out;
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        display: flex;
        flex-direction: column;
        gap: 1rem;
      `}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <Box
          key={idx}
          css={css`
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          `}
        >
          <Skeleton
            variant="rectangular"
            height={62}
            css={css`
              border-radius: 6px;
            `}
          />
        </Box>
      ))}
    </Box>
  );
}

interface SearchResultsProps {
  results: ProjectSearchResult['projects'];
  loading?: boolean;
  activeProjectId: string | null;
  totalResults: number;
}

function SearchResults({ results, totalResults, loading, activeProjectId }: SearchResultsProps) {
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

  function getSearchResultTitle(withStyling = false) {
    if (loading) return '';
    if (results.length === 1) return `${tr('projectListing.searchResultsTitleSingle')}:`;
    if (results.length < totalResults) {
      if (withStyling) {
        const title = tr('projectListing.searchResultsTitleExceeded').split('{0}');
        return (
          <>
            {title[0]}
            <b
              css={css`
                color: #525252;
              `}
            >
              {`yli ${results.length}`}
            </b>
            {title[1]}
          </>
        );
      }
      return tr('projectListing.searchResultsTitleExceeded', `yli ${results.length}`);
    }
    if (results.length > 0) {
      if (withStyling) {
        const title = tr('projectListing.searchResultsTitle').split('{0}');
        return (
          <>
            {title[0]}
            <b
              css={css`
                color: #525252;
              `}
            >
              {results.length}
            </b>
            {title[1]}:
          </>
        );
      }
      return `${tr('projectListing.searchResultsTitle', results.length)}:`;
    }

    return tr('itemSearch.noResults');
  }

  return (
    <Box
      aria-label={getSearchResultTitle() as string}
      css={css`
        scrollbar-gutter: stable;
        box-sizing: border-box;
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
          css={css`
            flex-grow: 1;
          `}
        >
          {!loading && getSearchResultTitle(true)}
        </Typography>

        <AsyncJobButton
          title={results?.length >= 1 ? tr('projectSearch.generateReport') : ''}
          css={css`
            & .MuiButtonBase-root {
              svg {
                margin-left: auto;
              }
            }
            & .MuiCircularProgress-root {
              left: 8px;
            }
          `}
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
          <FileDownload disabled={results?.length < 1} />
        </AsyncJobButton>
      </Box>
      {loading ? (
        <ProjectCardSkeleton count={3} />
      ) : (
        results.map((result) => (
          <ProjectCard
            result={result}
            key={result.projectId}
            highlighted={result.projectId === activeProjectId}
          />
        ))
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
  const activeItemId = useAtomValue(activeItemIdAtom);

  const search = trpc.project.search.useQuery({
    ...projectSearchParams,
    map: useDebounce(projectSearchParams.map, 400),
    text: useDebounce(projectSearchParams.text, 250),
    withProjectObjects: true,
  });

  return (
    <div css={resultsContainerStyle}>
      <SearchResults
        loading={search.isLoading}
        results={search.data?.projects ?? []}
        totalResults={search.data?.projectTotalCount ?? 0}
        activeProjectId={activeItemId}
      />
      <ResultsMap loading={search.isLoading} results={search.data} />
    </div>
  );
}

const projectPageStyle = css`
  flex: 1;
  min-height: 600px;
  display: flex;
  flex-direction: column;
`;

export function ProjectsPage() {
  return (
    <Box css={projectPageStyle}>
      <SearchControls />
      <ProjectResults />
    </Box>
  );
}
