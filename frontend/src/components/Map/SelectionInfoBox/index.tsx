import { Close, NavigateBefore, NavigateNext } from '@mui/icons-material';
import { Box, Button, IconButton, Typography, css } from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';
import { Pixel } from 'ol/pixel';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useTranslations } from '@frontend/stores/lang';
import { activeItemIdAtom, selectedItemIdsAtom } from '@frontend/stores/map';

import { ProjectData, ProjectObjectData } from '../MapWrapper';
import { ProjectDetails } from './ProjectDetails';
import { ProjectObjectDetails } from './ProjectObjectDetails';
import { StepIndicator } from './StepIndicator';

interface Props<TProject, TProjectObject> {
  parentWidth: number;
  parentHeight: number;
  pos: Pixel;
  projects?: TProject[];
  projectObjects?: TProjectObject[];
  handleActiveFeatureChange: (projectId: string) => void;
  handleCloseInfoBox: () => void;
}

export function SelectionInfoBox<
  TProject extends ProjectData,
  TProjectObject extends ProjectObjectData,
>({
  parentWidth,
  parentHeight,
  pos,
  handleActiveFeatureChange,
  handleCloseInfoBox,
  ...props
}: Props<TProject, TProjectObject>) {
  const tr = useTranslations();
  const selectedItemIds = useAtomValue(selectedItemIdsAtom);
  const [activeItemId, setActiveItemId] = useAtom(activeItemIdAtom);
  const [projects, setProjects] = useState<TProject[]>([]);
  const [projectObjects, setProjectObjects] = useState<TProjectObject[]>([]);
  const [activeItem, setActiveItem] = useState<TProject | TProjectObject | null>(null);
  const [infoBoxHeight, setInfoBoxHeight] = useState(190);

  useEffect(() => {
    // Doing this the hard way instead of props.projects.filter... to keep the order of the projects right
    if (props.projects) {
      setProjects(
        selectedItemIds
          .map((projectId) => props?.projects?.find((project) => project.projectId === projectId))
          .filter<TProject>((project): project is TProject => typeof project !== 'undefined'),
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
          .filter<TProjectObject>(
            (projectObject): projectObject is TProjectObject =>
              typeof projectObject !== 'undefined',
          ),
      );
  }, [props.projectObjects, selectedItemIds]);

  const allItems = useMemo(
    () => [...(projects ?? []), ...(projectObjects ?? [])],
    [projects, projectObjects],
  );

  const activeItemIndex = getActiveItemIndex();

  function isProjectObject(item: TProject | TProjectObject): item is TProjectObject {
    return Object.keys(item).includes('projectObjectId');
  }

  function getItemId(item: TProject | TProjectObject) {
    if (Object.keys(item).includes('projectObjectId')) {
      return (item as TProjectObject).projectObjectId;
    }
    return (item as TProject).projectId;
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

  function getLinkUrl(item: TProject | TProjectObject) {
    if (isProjectObject(item)) {
      if (item.project.projectType === 'investmentProject') {
        return `/investointihanke/${item?.project.projectId}/kohde/${item?.projectObjectId}`;
      } else if (item.project.projectType === 'maintenanceProject') {
        return `/kunnossapitohanke/${item?.project.projectId}/kohde/${item?.projectObjectId}`;
      }
      return '/kartta/kohteet';
    } else if (item.projectType === 'investmentProject') {
      return `/investointihanke/${item?.projectId}`;
    } else if (item.projectType === 'detailplanProject') {
      return `/asemakaavahanke/${item?.projectId}`;
    } else if (item.projectType === 'maintenanceProject') {
      return `/kunnossapitohanke/${item?.projectId}`;
    } else {
      return '/';
    }
  }

  useEffect(() => {
    setActiveItem(allItems[getActiveItemIndex()]);
    if (allItems.length > 1 && infoBoxHeight !== 200) {
      setInfoBoxHeight(200);
    } else if (infoBoxHeight !== 190 && allItems.length === 1) {
      setInfoBoxHeight(190);
    }
  }, [allItems, activeItemId]);

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
    min-height: ${infoBoxHeight}px;
    max-height: 55%;
    overflow-y: auto;
    overflow-x: hidden;
    background-color: #fff;
    border: solid 0.5px #c4c4c4;
    z-index: 300;
    border-radius: 6px;
    padding: 0.25rem;
  `;

  return (
    <Box css={toolbarStyle}>
      {activeItem && allItems.length > 0 && (
        <Box
          css={css`
            min-width: 340px;
          `}
        >
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
              min-width: 340px;
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
                <Button disabled={!projects} onClick={handleCloseInfoBox}>
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
      )}
    </Box>
  );
}
