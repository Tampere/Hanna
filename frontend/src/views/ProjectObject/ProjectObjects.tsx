import { css } from '@emotion/react';
import { NavigateNext } from '@mui/icons-material';
import { Box, Card, CardActionArea, Chip, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { langAtom, useTranslations } from '@frontend/stores/lang';
import { activeItemIdAtom } from '@frontend/stores/map';
import { projectObjectSearchParamAtom } from '@frontend/stores/search/projectObject';
import { useDebounce } from '@frontend/utils/useDebounce';
import { ProjectObjectResultsMap } from '@frontend/views/ProjectObject/ProjectObjectResultsMap';
import { SearchControls } from '@frontend/views/ProjectObject/SearchControls';

import { Code } from '@shared/schema/code';
import { ProjectObjectSearchResult } from '@shared/schema/projectObject';

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
};

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
  const tr = useTranslations();
  const lang = useAtomValue(langAtom);
  const projectObjectUrl = `${projectTypeRootUrl[result.projectType]}/${result.projectId}/kohde/${
    result.projectObjectId
  }`;

  return (
    <CardActionArea
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
            {result.projectName}
          </Typography>
          <Typography sx={{ lineHeight: '120%' }} variant="button">
            {result.objectName}
          </Typography>
          <Typography sx={{ lineHeight: '120%' }} variant="overline">
            {dayjs(result.startDate).format(tr('date.format'))} –{' '}
            {dayjs(result.endDate).format(tr('date.format'))}
          </Typography>
        </Box>
        {objectStageCodes && (
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
  loading?: boolean;
  activeProjectObjectId: string | null;
}

function SearchResults({ projectObjects, loading, activeProjectObjectId }: SearchResultsProps) {
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
              rowElement.scrollIntoView({ block: 'center' }),
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

  return (
    <Box
      aria-label={tr('projectListing.searchResultsTitle')}
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
          variant="h5"
          css={css`
            flex-grow: 1;
          `}
        >
          {tr('projectObjectListing.searchResultsTitle')}
          {!loading && (
            <Chip
              label={projectObjects?.length ?? 0}
              sx={{ ml: 1 }}
              size="small"
              variant="outlined"
            />
          )}
        </Typography>
      </Box>
      {projectObjects?.length > 0
        ? projectObjects.map((result, index) => {
            const displayProjectName =
              index === 0 || result.projectId !== projectObjects[index - 1].projectId;
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
                    {result.projectName}:
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
        : !loading && (
            <Box>
              <p>{tr('itemSearch.noResults')}</p>
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
        activeProjectObjectId={activeItemId}
      />
      <ProjectObjectResultsMap
        projectObjectsLoading={search.isLoading}
        projectObjectResults={search.data}
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