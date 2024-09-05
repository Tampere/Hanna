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

import { colorPalette } from '@frontend/components/Map/styles';
import { Info } from '@frontend/components/icons/Info';
import { useTranslations } from '@frontend/stores/lang';
import { VectorItemLayerKey } from '@frontend/stores/map';

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

const legendItems: Record<
  Extract<VectorItemLayerKey, 'projects' | 'projectObjects'>,
  { legendIcon: ReactJSXElement }
> = {
  projects: { legendIcon: <LayerLegendIcon color={colorPalette.projectClusterFill} /> },
  projectObjects: { legendIcon: <LayerLegendIcon color={colorPalette.projectObjectClusterFill} /> },
};

interface Props {
  vectorLayerKeys: Extract<VectorItemLayerKey, 'projects' | 'projectObjects'>[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggleButtonStyle?: (theme: Theme, isOpen: boolean) => SerializedStyles;
}

export function Legend({ vectorLayerKeys, isOpen, setIsOpen, toggleButtonStyle }: Props) {
  const tr = useTranslations();
  const theme = useTheme();

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
          {vectorLayerKeys.map((layer) => (
            <ListItem
              key={layer}
              css={css`
                padding: 0;
                & .MuiTypography-root {
                  font-size: 12px;
                  line-height: 12px;
                }
                justify-content: flex-start;
              `}
            >
              <ListItemIcon>{legendItems[layer].legendIcon}</ListItemIcon>
              <ListItemText primary={tr(`map.legend.${layer}`)} />
            </ListItem>
          ))}
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
