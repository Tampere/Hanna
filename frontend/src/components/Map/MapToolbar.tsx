import { css } from '@emotion/react';
import {
  Check,
  Clear,
  DeleteForeverTwoTone,
  EditTwoTone,
  PanToolAltTwoTone,
  PentagonTwoTone,
  PlaceTwoTone,
  RoundedCornerTwoTone,
  UndoTwoTone,
} from '@mui/icons-material';
import { Box, Divider, IconButton, Tooltip } from '@mui/material';
import { useState } from 'react';

import { useTranslations } from '@frontend/stores/lang';

import { TranslationKey } from '@shared/language';

const toolsContainerStyle = css`
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: center;
  width: 48px;
  top: 0;
  bottom: 0;
  right: 0;
  background: #eee;
  border-left: 1px solid #aaa;
  opacity: 1;
  z-index: 200;
`;

const selectedToolStyle = css`
  background: #bbb;
  border-radius: 0;
  :hover {
    background: #999;
  }
`;

const toolBtnStyle = css`
  :hover {
    background-color: #bbb;
  }
  border-radius: 0;
`;

export type ToolType =
  | 'selectFeature'
  | 'newFeature'
  | 'newPointFeature'
  | 'tracedFeature'
  | 'editFeature'
  | 'clearSelectedFeature'
  | 'deleteFeature';

interface Tool {
  type: ToolType;
  icon: JSX.Element;
  tooltip: TranslationKey;
  disabledTooltip?: TranslationKey;
  color?: 'primary' | 'secondary';
}

const tools: readonly Tool[] = [
  {
    type: 'newPointFeature',
    icon: <PlaceTwoTone />,
    tooltip: 'mapEdit.newPointFetureTooltip',
    disabledTooltip: 'mapEdit.newPointFeatureDisabledTooltip',
  },
  {
    type: 'newFeature',
    icon: <PentagonTwoTone />,
    tooltip: 'mapEdit.newFeatureTooltip',
    disabledTooltip: 'mapEdit.newFeatureDisabledTooltip',
  },
  {
    type: 'selectFeature',
    icon: <PanToolAltTwoTone />,
    tooltip: 'mapEdit.selectFeatureTooltip',
  },
  {
    type: 'tracedFeature',
    icon: <RoundedCornerTwoTone />,
    tooltip: 'mapEdit.tracedFeatureTooltip',
  },
  {
    type: 'editFeature',
    icon: <EditTwoTone />,
    tooltip: 'mapEdit.editFeatureTooltip',
  },
  {
    type: 'clearSelectedFeature',
    icon: <Clear />,
    tooltip: 'mapEdit.clearSelectedFeatureTooltip',
  },
  {
    type: 'deleteFeature',
    icon: <DeleteForeverTwoTone />,
    color: 'secondary',
    tooltip: 'mapEdit.removeFeatureTooltip',
  },
] as const;

interface Props {
  toolsDisabled: Partial<Record<ToolType, boolean>>;
  toolsHidden?: ToolType[];
  onToolChange: (tool: ToolType | null) => void;
  onSaveClick: () => void;
  onUndoClick: () => void;
  saveDisabled?: boolean;
  undoDisabled?: boolean;
}

export function MapToolbar(props: Props) {
  const tr = useTranslations();
  const [selectedTool, setSelectedTool] = useState<ToolType | null>(null);

  function handleToolClick(tool: ToolType | null) {
    setSelectedTool(tool);
    props.onToolChange(tool);
  }

  return (
    <Box css={toolsContainerStyle}>
      {tools.map((tool) => {
        if (props.toolsHidden?.includes(tool.type)) return null;
        return (
          <Tooltip
            placement="left"
            key={tool.type}
            title={
              tool.disabledTooltip && props.toolsDisabled[tool.type]
                ? tr(tool.disabledTooltip)
                : tr(tool.tooltip)
            }
          >
            <Box>
              <IconButton
                disabled={props.toolsDisabled[tool.type]}
                css={selectedTool === tool.type ? selectedToolStyle : toolBtnStyle}
                color={tool?.color || 'primary'}
                onClick={() => handleToolClick(selectedTool === tool.type ? null : tool.type)}
              >
                {tool.icon}
              </IconButton>
            </Box>
          </Tooltip>
        );
      })}
      <Divider sx={{ mt: 2, mb: 2 }} />
      <Tooltip placement="left" title={tr('mapEdit.undoTooltip')}>
        <Box>
          <IconButton
            disabled={props.undoDisabled}
            css={toolBtnStyle}
            color="primary"
            onClick={props.onUndoClick}
          >
            <UndoTwoTone />
          </IconButton>
        </Box>
      </Tooltip>
      <Tooltip placement="left" title={tr('mapEdit.saveTooltip')}>
        <Box>
          <IconButton
            disabled={props.saveDisabled}
            css={toolBtnStyle}
            color="primary"
            onClick={props.onSaveClick}
          >
            <Check />
          </IconButton>
        </Box>
      </Tooltip>
    </Box>
  );
}
