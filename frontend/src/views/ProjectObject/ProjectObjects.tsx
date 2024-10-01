import { css } from '@emotion/react';
import { NavigateNext } from '@mui/icons-material';
import { Box, Card, CardActionArea, Skeleton, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { langAtom, useTranslations } from '@frontend/stores/lang';
import { activeItemIdAtom } from '@frontend/stores/map';
import { projectObjectSearchParamAtom } from '@frontend/stores/search/projectObject';
import { useMapInfoBox } from '@frontend/stores/useMapInfoBox';
import { useDebounce } from '@frontend/utils/useDebounce';
import { ProjectObjectResultsMap } from '@frontend/views/ProjectObject/ProjectObjectResultsMap';
import { SearchControls } from '@frontend/views/ProjectObject/SearchControls';

import { Code } from '@shared/schema/code';
import { ProjectObjectSearchResult } from '@shared/schema/projectObject/search';

const projectObjectCardStyle = (highlighted: boolean) => css`
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

function ProjectObjectCardSkeleton({ count = 1 }: { count: number }) {
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
          <Typography
            css={css`
              width: 30%;
            `}
          >
            <Skeleton variant="rectangular" />
          </Typography>
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

function ProjectObjectCard({
  result,
  highlighted,
  objectStageCodes,
  newObjectHighlightId,
}: {
  result: ProjectObjectSearchResult['projectObjects'][number];
  highlighted: boolean;
  objectStageCodes?: readonly Code[];
  newObjectHighlightId: string | null;
}) {
  const { resetInfoBox } = useMapInfoBox();
  const tr = useTranslations();
  const lang = useAtomValue(langAtom);
  const projectObjectUrl = `${projectTypeRootUrl[result.project.projectType]}/${
    result.project.projectId
  }/kohde/${result.projectObjectId}`;

  return (
    <CardActionArea
      onClick={() => resetInfoBox()}
      css={css`
        & .highlight-new {
          animation-name: fadeInOut;
          animation-duration: 5000ms;
          @keyframes fadeInOut {
            0% {
              background-color: inherit;
            }
            50% {
              background-color: lightgreen;
            }
            100% {
              background-color: inherit;
            }
          }
        }
      `}
      id={`projectObject-${result.projectObjectId}`}
      component={Link}
      to={projectObjectUrl}
    >
      <Card
        className={result.projectObjectId === newObjectHighlightId ? 'highlight-new' : ''}
        variant="outlined"
        css={projectObjectCardStyle(highlighted)}
      >
        <NavigateNext sx={{ color: '#aaa', mr: 1 }} />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
          }}
        >
          <Typography
            css={css`
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
              font-size: 0.75rem;
            `}
            color="green"
          >
            {result.project.projectName}
          </Typography>
          <Typography sx={{ lineHeight: '120%' }} variant="button">
            {result.objectName}
          </Typography>
          <Typography sx={{ lineHeight: '120%' }} variant="overline">
            {dayjs(result.startDate).format(tr('date.format'))} –{' '}
            {result.endDate !== 'infinity' && dayjs(result.endDate).format(tr('date.format'))}
          </Typography>
        </Box>
        {objectStageCodes && result?.objectStage && (
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
            {objectStageCodes.find((code) => code.id.id === result.objectStage)?.text[lang]}
          </span>
        )}
      </Card>
    </CardActionArea>
  );
}

interface SearchResultsProps {
  projectObjects: ProjectObjectSearchResult['projectObjects'];
  totalResults: number;
  loading?: boolean;
  activeProjectObjectId: string | null;
}

function SearchResults({
  projectObjects,
  totalResults,
  loading,
  activeProjectObjectId,
}: SearchResultsProps) {
  const tr = useTranslations();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const [newObjectHighlightId, setNewObjectHighlightId] = useState<string | null>(
    queryParams.get('highlight'),
  );

  const codes = trpc.code.get.useQuery({ codeListId: 'KohteenLaji' });

  useEffect(() => {
    const activeProjectObjectCard = document.getElementById(
      `projectObject-${activeProjectObjectId}`,
    );

    if (activeProjectObjectCard) {
      activeProjectObjectCard.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeProjectObjectId]);

  useEffect(() => {
    if (projectObjects && newObjectHighlightId) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            const rowElement = document.getElementById(`projectObject-${newObjectHighlightId}`);
            if (rowElement) {
              rowElement.scrollIntoView({ block: 'center' });
              setTimeout(() => setNewObjectHighlightId(null), 5000);
              observer.disconnect();
            }
          }
        });
      });

      observer.observe(document.body, { childList: true, subtree: true });

      return () => observer.disconnect();
    }
  }, [projectObjects, newObjectHighlightId]);

  function getSearchResultTitle(withStyling = false) {
    if (loading) return '';
    if (projectObjects.length === 1)
      return `${tr('projectObjectListing.searchResultsTitleSingle')}:`;
    if (projectObjects.length < totalResults) {
      if (withStyling) {
        const title = tr('projectObjectListing.searchResultsTitleExceeded').split('{0}');
        return (
          <>
            {title[0]}
            <b
              css={css`
                color: #525252;
              `}
            >
              {`yli ${projectObjects.length}`}
            </b>
            {title[1]}
          </>
        );
      }
      return tr('projectObjectListing.searchResultsTitleExceeded', `yli ${projectObjects.length}`);
    }
    if (projectObjects.length > 0) {
      if (withStyling) {
        const title = tr('projectObjectListing.searchResultsTitle').split('{0}');
        return (
          <>
            {title[0]}
            <b
              css={css`
                color: #525252;
              `}
            >
              {projectObjects.length}
            </b>
            {title[1]}:
          </>
        );
      }
      return `${tr('projectObjectListing.searchResultsTitle', projectObjects.length)}:`;
    }

    return tr('itemSearch.noResults');
  }

  return (
    <Box
      aria-label={getSearchResultTitle() as string}
      css={css`
        scrollbar-gutter: stable;
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
      </Box>

      {loading ? (
        <ProjectObjectCardSkeleton count={3} />
      ) : (
        projectObjects.map((result, index) => {
          const displayProjectName =
            index === 0 || result.project.projectId !== projectObjects[index - 1].project.projectId;
          return (
            <Box key={result.projectObjectId}>
              {displayProjectName && (
                <Typography
                  css={css`
                    max-width: 75%;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  `}
                >
                  {result.project.projectName}:
                </Typography>
              )}
              <ProjectObjectCard
                result={result}
                highlighted={result.projectObjectId === activeProjectObjectId}
                objectStageCodes={codes.data}
                newObjectHighlightId={newObjectHighlightId}
              />
            </Box>
          );
        })
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

function ProjectObjectResults() {
  const projectObjectSearchParams = useAtomValue(projectObjectSearchParamAtom);
  const activeItemId = useAtomValue(activeItemIdAtom);

  const search = trpc.projectObject.search.useQuery({
    ...projectObjectSearchParams,
    map: useDebounce(projectObjectSearchParams.map, 400),
  });

  return (
    <div css={resultsContainerStyle}>
      <SearchResults
        loading={search.isLoading}
        projectObjects={search.data?.projectObjects ?? []}
        totalResults={search.data?.totalCount ?? 0}
        activeProjectObjectId={activeItemId}
      />
      <ProjectObjectResultsMap
        projectObjectsLoading={search.isLoading}
        projectObjectResults={search.data}
        projects={search.data?.projectObjects?.reduce?.(
          (projects, projectObject) => {
            if (projects.some((project) => project.projectId === projectObject.project.projectId)) {
              return projects;
            }
            return projects.concat(projectObject.project);
          },
          [] as ProjectObjectSearchResult['projectObjects'][number]['project'][],
        )}
      />
    </div>
  );
}

const projectObjectsPageStyle = css`
  flex: 1;
  min-height: 600px;
  display: flex;
  flex-direction: column;
`;

export function ProjectObjectsPage() {
  return (
    <Box css={projectObjectsPageStyle}>
      <SearchControls />
      <ProjectObjectResults />
    </Box>
  );
}
