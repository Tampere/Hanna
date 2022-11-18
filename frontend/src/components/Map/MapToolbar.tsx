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
  tooltip: string;
  color?: 'primary' | 'secondary';
}

const tools: readonly Tool[] = [
  {
    type: 'newFeature',
    icon: <PentagonTwoTone />,
    tooltip: 'Lisää alue',
  },
  {
    type: 'selectFeature',
    icon: <PanToolAltTwoTone />,
    tooltip: 'Valitse geometria',
  },
  {
    type: 'tracedFeature',
    icon: <RoundedCornerTwoTone />,
    tooltip: 'Lisää vierekkäinen geometria',
  },
  {
    type: 'editFeature',
    icon: <EditTwoTone />,
    tooltip: 'Muokkaa geometriaa',
  },
  {
    type: 'deleteFeature',
    icon: <DeleteForeverTwoTone />,
    color: 'secondary',
    tooltip: 'Poista geometria',
  },
] as const;

interface Props {
  onToolChange: (tool: ToolType | null) => void;
  onSaveClick: () => void;
  onUndoClick: () => void;
}

export function MapToolbar(props: Props) {
  const [selectedTool, setSelectedTool] = useState<ToolType | null>(null);

  function handleToolClick(tool: ToolType | null) {
    setSelectedTool(tool);
    props.onToolChange(tool);
  }

  return (
    <Box css={toolsContainerStyle}>
      {tools.map((tool) => (
        <Tooltip placement="left" key={tool.type} title={tool.tooltip}>
          <IconButton
            css={selectedTool === tool.type ? selectedToolStyle : toolBtnStyle}
            color={tool?.color || 'primary'}
            onClick={() => handleToolClick(selectedTool === tool.type ? null : tool.type)}
          >
            {tool.icon}
          </IconButton>
        </Tooltip>
      ))}
      <Divider sx={{ mt: 2, mb: 2 }} />
      <Tooltip placement="left" title="Peruuta muutokset">
        <IconButton disabled={true} css={toolBtnStyle} color="primary" onClick={props.onUndoClick}>
          <UndoTwoTone />
        </IconButton>
      </Tooltip>
      <Tooltip placement="left" title="Tallenna muutokset">
        <IconButton css={toolBtnStyle} color="primary" onClick={props.onSaveClick}>
          <SaveTwoTone />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
