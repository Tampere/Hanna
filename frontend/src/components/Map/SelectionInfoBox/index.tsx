import { ChevronRight, Close, NavigateBefore, NavigateNext } from '@mui/icons-material';
import { Box, Button, IconButton, Typography, css } from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';
import { Pixel } from 'ol/pixel';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useTranslations } from '@frontend/stores/lang';
import { activeItemIdAtom, selectedItemIdAtom } from '@frontend/stores/map';

import { ProjectSearchResult } from '@shared/schema/project';
import { ProjectObjectSearchResult } from '@shared/schema/projectObject';

import { ProjectDetails } from './ProjectDetails';
import { ProjectObjectDetails } from './ProjectObjectDetails';
import { StepIndicator } from './StepIndicator';

interface Props {
  parentWidth: number;
  parentHeight: number;
  pos: Pixel;
  projects?: ProjectSearchResult['projects'];
  projectObjects?: ProjectObjectSearchResult['projectObjects'];
  handleActiveFeatureChange: (projectId: string) => void;
  handleCloseInfoBox: () => void;
}

type ProjectObjectResult = ProjectObjectSearchResult['projectObjects'][number];
type ProjectResult = ProjectSearchResult['projects'][number];

export function SelectionInfoBox({
  parentWidth,
  parentHeight,
  pos,
  handleActiveFeatureChange,
  handleCloseInfoBox,
  ...props
}: Props) {
  const tr = useTranslations();
  const selectedItemIds = useAtomValue(selectedItemIdAtom);
  const [activeItemId, setActiveItemId] = useAtom(activeItemIdAtom);
  const [projects, setProjects] = useState<ProjectSearchResult['projects']>([]);
  const [projectObjects, setProjectObjects] = useState<ProjectObjectSearchResult['projectObjects']>(
    [],
  );

  useEffect(() => {
    // Doing this the hard way instead of props.projects.filter... to keep the order of the projects right
    if (props.projects) {
      setProjects(
        selectedItemIds
          .map((projectId) => props?.projects?.find((project) => project.projectId === projectId))
          .filter<ProjectResult>(
            (project): project is ProjectResult => typeof project !== 'undefined',
          ),
      );
    }
  }, [props.projects, selectedItemIds]);

  useEffect(() => {
    if (props.projectObjects)
      setProjectObjects(
        selectedItemIds
          .map(
            (projectId) =>
              props?.projectObjects?.find(
                (projectObject) => projectObject.projectObjectId === projectId,
              ),
          )
          .filter<ProjectObjectResult>(
            (projectObject): projectObject is ProjectObjectResult =>
              typeof projectObject !== 'undefined',
          ),
      );
  }, [props.projectObjects, selectedItemIds]);

  const allItems = [...(projects ?? []), ...(projectObjects ?? [])];

  function isProjectObject(item: ProjectResult | ProjectObjectResult): item is ProjectObjectResult {
    return Object.keys(item).includes('projectObjectId');
  }

  function getItemId(item: ProjectResult | ProjectObjectResult) {
    if (Object.keys(item).includes('projectObjectId')) {
      return (item as ProjectObjectResult).projectObjectId;
    }
    return item.projectId;
  }

  function handleNext() {
    setActiveItemId(getItemId(allItems[activeItemIndex + 1]));
    handleActiveFeatureChange(getItemId(allItems[activeItemIndex + 1]));
  }

  function handleBack() {
    setActiveItemId(getItemId(allItems[activeItemIndex - 1]));
    handleActiveFeatureChange(getItemId(allItems[activeItemIndex - 1]));
  }

  function getActiveItemIndex() {
    const index = allItems?.findIndex((item) => getItemId(item) === activeItemId) ?? 0;
    if (index === -1) return 0;
    return index;
  }

  function getLinkUrl(item: ProjectResult | ProjectObjectResult) {
    if (isProjectObject(item)) {
      return `/investointihanke/${item?.projectId}/kohde/${item?.projectObjectId}`;
    } else if (item.projectType === 'investmentProject') {
      return `/investointihanke/${item?.projectId}`;
    } else if (item.projectType === 'detailplanProject') {
      return `/asemakaavahanke/${item?.projectId}`;
    } else {
      return '/';
    }
  }

  const activeItemIndex = getActiveItemIndex();
  const activeItem = allItems[activeItemIndex];
  const pageNumberIndicator = `${activeItemIndex + 1}/${projects.length + projectObjects.length}`;

  const toolbarStyle = css`
    box-shadow:
      0px 3px 5px -1px rgba(0, 0, 0, 0.2),
      0px 5px 8px 0px rgba(0, 0, 0, 0.14),
      0px 1px 14px 0px rgba(0, 0, 0, 0.12);
    position: absolute;
    top: ${pos[1]}px;
    left: ${pos[0]}px;
    transform: translate(
      ${parentWidth && pos[0] > parentWidth / 2 ? '-100%' : '0'},
      ${parentHeight && pos[1] > parentHeight / 2 ? '-100%' : '0'}
    );

    width: 350px;
    min-height: ${projects.length > 1 ? 200 : 190}px;
    max-height: 55%;
    overflow-y: auto;
    overflow-x: hidden;
    background-color: #fff;
    border: solid 0.5px #c4c4c4;
    z-index: 300;
    border-radius: 6px;
    padding: 0.25rem;
  `;

  if (!activeItem) return null;

  return (
    <Box css={toolbarStyle}>
      <Box
        css={css`
          min-width: 0; // for ellipsis to work
          display: flex;
          justify-content: space-between;
          align-items: end;
          color: #525252;
          height: 30px;
        `}
      >
        <Typography>{allItems.length > 1 && pageNumberIndicator}</Typography>
        <Typography
          title={isProjectObject(activeItem) ? activeItem.objectName : activeItem.projectName}
          css={(theme) => css`
            color: ${isProjectObject(activeItem) ? theme.palette.primary.main : 'green'};
            margin-right: auto;
            padding-left: 0.75rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 1rem;
            font-weight: 700;
          `}
        >
          {isProjectObject(activeItem) ? activeItem.objectName : activeItem.projectName}
        </Typography>
        <IconButton
          css={css`
            align-self: flex-start;
            padding: 0;
          `}
          onClick={handleCloseInfoBox}
        >
          <Close />
        </IconButton>
      </Box>

      <Box
        css={css`
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        `}
      >
        {allItems.length > 1 && (
          <IconButton
            css={css`
              padding: 0;
            `}
            onClick={handleBack}
            disabled={activeItemIndex === 0}
          >
            <NavigateBefore />
          </IconButton>
        )}
        <Box
          css={css`
            padding: 0 0.75rem;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          `}
        >
          <Box
            css={css`
              height: 100px;
              padding-top: 0.5rem;
              display: flex;
              align-items: center;
            `}
          >
            {isProjectObject(activeItem) ? (
              <ProjectObjectDetails projectObject={activeItem} />
            ) : (
              <ProjectDetails project={activeItem} />
            )}
          </Box>
          <Link
            css={css`
              pointer-events: ${!projects ? 'none' : 'auto'};
              flex: 1;
              margin-top: auto;
            `}
            to={getLinkUrl(activeItem)}
          >
            <Button disabled={!projects} endIcon={<ChevronRight />} onClick={handleCloseInfoBox}>
              {isProjectObject(activeItem)
                ? tr('itemInfoBox.toObject')
                : tr('itemInfoBox.toProject')}
            </Button>
          </Link>
        </Box>

        {allItems.length > 1 && (
          <IconButton
            css={css`
              margin-left: auto;
              padding: 0;
            `}
            onClick={handleNext}
            disabled={activeItemIndex === allItems.length - 1}
          >
            <NavigateNext />
          </IconButton>
        )}
      </Box>
      {allItems.length > 1 && (
        <StepIndicator steps={allItems.length} activeStep={activeItemIndex} />
      )}
    </Box>
  );
}
