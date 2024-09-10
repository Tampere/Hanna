import { SerializedStyles, useTheme } from '@emotion/react';
import { ReactJSXElement } from '@emotion/react/types/jsx-namespace';
import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Theme,
  Tooltip,
  Typography,
  css,
} from '@mui/material';
import { useAtomValue } from 'jotai';
import { ProjectType, projectTypes } from 'tre-hanna-shared/src/schema/project/type';

import { colorPalette } from '@frontend/components/Map/styles';
import { Info } from '@frontend/components/icons/Info';
import { useTranslations } from '@frontend/stores/lang';
import {
  SelectedProjectColorCode,
  VectorItemLayerKey,
  selectedFeatureColorCodeAtom,
} from '@frontend/stores/map';

function LayerLegendIcon({ color }: { color: string }) {
  return (
    <span
      css={css`
        border: 6px solid ${color};
        border-radius: 50%;
      `}
    />
  );
}

function getLegendItems(
  selectedColorCodes?: SelectedProjectColorCode['projectColorCodes'],
): Record<
  Extract<VectorItemLayerKey, 'projects' | 'projectObjects'> | ProjectType,
  { legendIcon: ReactJSXElement }
> {
  return {
    projects: { legendIcon: <LayerLegendIcon color={colorPalette.projectClusterFill} /> },
    projectObjects: {
      legendIcon: <LayerLegendIcon color={colorPalette.projectObjectClusterFill} />,
    },
    investmentProject: {
      legendIcon: (
        <LayerLegendIcon
          color={selectedColorCodes?.investmentProject.stroke ?? colorPalette.projectClusterFill}
        />
      ),
    },
    maintenanceProject: {
      legendIcon: (
        <LayerLegendIcon
          color={selectedColorCodes?.maintenanceProject.stroke ?? colorPalette.projectClusterFill}
        />
      ),
    },
    detailplanProject: {
      legendIcon: (
        <LayerLegendIcon
          color={selectedColorCodes?.detailplanProject.stroke ?? colorPalette.projectClusterFill}
        />
      ),
    },
  };
}

interface Props {
  vectorLayerKeys: Extract<VectorItemLayerKey, 'projects' | 'projectObjects'>[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggleButtonStyle?: (theme: Theme, isOpen: boolean) => SerializedStyles;
  colorPatternSelectorVisible?: boolean;
}

const listItemStyle = css`
  padding: 0;
  & .MuiTypography-root {
    font-size: 12px;
    line-height: 12px;
  }
  justify-content: flex-start;
`;

export function Legend({
  vectorLayerKeys,
  colorPatternSelectorVisible = false,
  toggleButtonStyle,
  isOpen,
  setIsOpen,
}: Props) {
  const tr = useTranslations();
  const theme = useTheme();
  const selectedFeatureColorCode = useAtomValue(selectedFeatureColorCodeAtom);
  const displayDefaultLegend =
    !selectedFeatureColorCode.projectColorCodes || !colorPatternSelectorVisible;
  console.log(projectTypes);
  return (
    <>
      <Box
        css={css`
          z-index: ${isOpen ? 200 : -1};
          opacity: ${isOpen ? 0.95 : 0};
          transition: opacity 0.15s ease-in-out;
          box-shadow: 1px 1px 4px #9c9c9c;
          min-width: 150px;
          display: flex;
          flex-direction: column;
          position: absolute;
          bottom: 0;
          left: 0;
          padding: 0.25rem 0.5rem calc(42px + 2rem) 1rem;
          background-color: white;
          box-shadow:
            0,
            0px 5px 8px 0px rgba(0, 0, 0, 0.14),
            0;
        `}
      >
        <Typography
          css={css`
            white-space: nowrap;
          `}
          variant="overline"
        >
          {tr('map.legend.title')}
        </Typography>
        <List
          css={css`
            & .MuiListItemIcon-root {
              min-width: 25px;
            }
            border-bottom: 1px solid #c4c4c4;
            padding: 0 0 0.5rem 0;
          `}
          dense
        >
          {vectorLayerKeys.map((layer) =>
            displayDefaultLegend ? (
              <ListItem key={layer} css={listItemStyle}>
                <ListItemIcon>{getLegendItems()[layer].legendIcon}</ListItemIcon>
                <ListItemText primary={tr(`map.legend.${layer}`)} />
              </ListItem>
            ) : layer === 'projects' ? (
              projectTypes.map((projectType) => (
                <ListItem key={projectType} css={listItemStyle}>
                  <ListItemIcon>
                    {
                      getLegendItems(selectedFeatureColorCode.projectColorCodes)[projectType]
                        .legendIcon
                    }
                  </ListItemIcon>
                  <ListItemText primary={tr(`map.legend.${projectType}`)} />
                </ListItem>
              ))
            ) : (
              <ListItem key={layer} css={listItemStyle}>
                <ListItemIcon>
                  {getLegendItems(selectedFeatureColorCode.projectColorCodes)[layer].legendIcon}
                </ListItemIcon>
                <ListItemText primary={tr(`map.legend.${layer}`)} />
              </ListItem>
            ),
          )}
        </List>
      </Box>

      <Tooltip
        placement="top"
        title={isOpen ? tr('map.legend.hideTooltip') : tr('map.legend.showTooltip')}
      >
        <IconButton
          css={(theme) => toggleButtonStyle?.(theme, isOpen)}
          onClick={() => setIsOpen(!isOpen)}
          disableTouchRipple
        >
          {isOpen ? <Info fillColor="#fff" /> : <Info fillColor={theme.palette.primary.main} />}
        </IconButton>
      </Tooltip>
    </>
  );
}
