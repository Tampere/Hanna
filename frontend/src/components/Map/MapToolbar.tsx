import { css } from '@emotion/react';
import {
  Clear,
  CopyAllTwoTone,
  DeleteForeverTwoTone,
  EditTwoTone,
  LayersClearOutlined,
  PanToolAltTwoTone,
  PentagonTwoTone,
  PlaceTwoTone,
  RoundedCornerTwoTone,
} from '@mui/icons-material';
import { Box, Divider, IconButton, Tooltip } from '@mui/material';
import { useState } from 'react';
import { useLocation, useParams } from 'react-router';

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
  left: 0;
  background: #eee;
  border-right: 1px solid #aaa;
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
  | 'deleteFeature'
  | 'deleteAllFeatures'
  | 'copyFromSelection';

interface Tool {
  type: ToolType;
  icon: JSX.Element;
  tooltip: TranslationKey | Record<string, Record<string, TranslationKey>>;
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
    type: 'copyFromSelection',
    icon: <CopyAllTwoTone />,
    tooltip: {
      new: {
        project: 'mapEdit.copyFromSelectionTooltip.new.project',
        projectObject: 'mapEdit.copyFromSelectionTooltip.new.projectObject',
      },
      existing: {
        project: 'mapEdit.copyFromSelectionTooltip.existing.project',
        projectObject: 'mapEdit.copyFromSelectionTooltip.existing.projectObject',
      },
    },
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
  {
    type: 'deleteAllFeatures',
    icon: <LayersClearOutlined />,
    color: 'secondary',
    tooltip: 'mapEdit.removeAllTooltip',
  },
] as const;

interface Props {
  toolsDisabled: Partial<Record<ToolType, boolean>>;
  toolsHidden?: ToolType[];
  onToolChange: (tool: ToolType | null) => void;
  geometryExists?: boolean;
}

export function MapToolbar(props: Props) {
  const tr = useTranslations();
  const [selectedTool, setSelectedTool] = useState<ToolType | null>(null);
  const { projectObjectId } = useParams() as { projectObjectId?: string };
  const { pathname } = useLocation();
  const isProjectObjectView = projectObjectId || pathname.includes('uusi-kohde');

  function handleToolClick(tool: ToolType | null) {
    if (tool === 'copyFromSelection' || tool === 'deleteAllFeatures') {
      setSelectedTool(null);
    } else {
      setSelectedTool(tool);
    }
    props.onToolChange(tool);
  }

  return (
    <Box css={toolsContainerStyle}>
      {tools.map((tool) => {
        if (props.toolsHidden?.includes(tool.type)) return null;
        return (
          <Tooltip
            placement="right"
            key={tool.type}
            title={
              tool.disabledTooltip && props.toolsDisabled[tool.type]
                ? tr(tool.disabledTooltip)
                : typeof tool.tooltip === 'object'
                  ? tr(
                      tool.tooltip[props.geometryExists ? 'existing' : 'new'][
                        isProjectObjectView ? 'projectObject' : 'project'
                      ],
                    )
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
    </Box>
  );
}
