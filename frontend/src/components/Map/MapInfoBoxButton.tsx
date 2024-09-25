import { IconButton, Tooltip, css } from '@mui/material';
import { useSetAtom } from 'jotai';
import { Pixel } from 'ol/pixel';
import { useParams } from 'react-router';

import { ProjectData } from '@frontend/components/Map/MapWrapper';
import { SelectionInfoBox } from '@frontend/components/Map/SelectionInfoBox';
import { TreBorderIcon } from '@frontend/components/icons/TreBorderIcon';
import { useTranslations } from '@frontend/stores/lang';
import { activeItemIdAtom } from '@frontend/stores/map';

interface Props<TProject> {
  projects?: TProject[];
  pos: Pixel;
  handleCloseInfoBox: () => void;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onClick: () => void;
}

export function MapInfoBoxButton<TProject extends ProjectData>({
  projects,
  pos,
  handleCloseInfoBox,
  isOpen,
  setIsOpen,
  onClick,
}: Props<TProject>) {
  const tr = useTranslations();
  const setActiveItemId = useSetAtom(activeItemIdAtom);
  const { projectObjectId } = useParams();

  if (!projects) {
    return null;
  }

  return (
    <>
      {projects?.length > 0 && (
        <Tooltip
          title={
            projectObjectId
              ? tr('wholeMunicipalityMapInfoBoxButton.singleTooltip')
              : tr('wholeMunicipalityMapInfoBoxButton.tooltip')
          }
          enterDelay={1000}
        >
          <IconButton
            onClick={() => {
              setActiveItemId(projects[0].projectId);
              onClick();
            }}
            disableRipple
            css={(theme) => css`
              position: absolute;
              top: 1rem;
              right: 2.5rem;
              padding: 0;
              z-index: 202;
              :hover .MuiSvgIcon-root .icon-path {
                stroke: ${theme.palette.primary.main} !important;
              }
              :active .MuiSvgIcon-root .icon-path {
                fill-opacity: 0.4 !important;
              }
            `}
          >
            <TreBorderIcon
              text={String(projects.length)}
              textColor={isOpen ? 'black' : 'white'}
              fillColor={isOpen ? 'rgba(255, 255, 0, 0.9)' : '#4BA226'}
              strokeColor={isOpen ? 'black' : 'white'}
            />
          </IconButton>
        </Tooltip>
      )}
      {isOpen && projects?.length > 0 && (
        <SelectionInfoBox
          selectedItemIds={projects.map((p) => p.projectId)}
          projects={projects}
          parentHeight={0}
          parentWidth={0}
          pos={pos}
          handleCloseInfoBox={() => {
            setIsOpen(false);
            handleCloseInfoBox();
          }}
        />
      )}
    </>
  );
}
