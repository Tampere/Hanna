import { css } from '@emotion/react';
import {
  DeleteForeverTwoTone,
  EditTwoTone,
  PanToolAltTwoTone,
  PentagonTwoTone,
  RoundedCornerTwoTone,
  SaveTwoTone,
  UndoTwoTone,
} from '@mui/icons-material';
import { Box, Divider, IconButton, Tooltip } from '@mui/material';
import { useState } from 'react';

import { TranslationKey, useTranslations } from '@frontend/stores/lang';

const toolsContainerStyle = css`
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: start;
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
  | 'tracedFeature'
  | 'editFeature'
  | 'deleteFeature';

interface Tool {
  type: ToolType;
  icon: JSX.Element;
  tooltip: TranslationKey;
  color?: 'primary' | 'secondary';
}

const tools: readonly Tool[] = [
  {
    type: 'newFeature',
    icon: <PentagonTwoTone />,
    tooltip: 'mapEdit.newFeatureTooltip',
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
    type: 'deleteFeature',
    icon: <DeleteForeverTwoTone />,
    color: 'secondary',
    tooltip: 'mapEdit.removeFeatureTooltip',
  },
] as const;

interface Props {
  toolsDisabled: Partial<Record<ToolType, boolean>>;
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
      {tools.map((tool) => (
        <Tooltip placement="left" key={tool.type} title={tr(tool.tooltip)}>
          <IconButton
            disabled={props.toolsDisabled[tool.type]}
            css={selectedTool === tool.type ? selectedToolStyle : toolBtnStyle}
            color={tool?.color || 'primary'}
            onClick={() => handleToolClick(selectedTool === tool.type ? null : tool.type)}
          >
            {tool.icon}
          </IconButton>
        </Tooltip>
      ))}
      <Divider sx={{ mt: 2, mb: 2 }} />
      <Tooltip placement="left" title={tr('mapEdit.undoTooltip')}>
        <IconButton
          disabled={props.undoDisabled}
          css={toolBtnStyle}
          color="primary"
          onClick={props.onUndoClick}
        >
          <UndoTwoTone />
        </IconButton>
      </Tooltip>
      <Tooltip placement="left" title={tr('mapEdit.saveTooltip')}>
        <IconButton
          disabled={props.saveDisabled}
          css={toolBtnStyle}
          color="primary"
          onClick={props.onSaveClick}
        >
          <SaveTwoTone />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
