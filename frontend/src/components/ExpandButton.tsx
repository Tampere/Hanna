import { SerializedStyles } from '@emotion/react';
import { ChevronLeft, ChevronRight, ExpandLess, ExpandMore } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import { useState } from 'react';

const expandIcons = {
  vertical: {
    expanded: <ExpandLess />,
    collapsed: <ExpandMore />,
  },
  horizontal: {
    expanded: <ChevronLeft />,
    collapsed: <ChevronRight />,
  },
};

interface Props {
  iconOrientation: keyof typeof expandIcons;
  expandedTitle: string;
  collapsedTitle: string;
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  cssProp?: SerializedStyles;
}

export function ExpandButton({
  iconOrientation,
  expandedTitle,
  collapsedTitle,
  expanded,
  setExpanded,
  cssProp,
}: Props) {
  const [expandTooltipOpen, setExpandTooltipOpen] = useState(false);

  return (
    <Tooltip
      {...(cssProp && { css: cssProp })}
      open={expandTooltipOpen}
      onOpen={() => setExpandTooltipOpen(true)}
      onClose={() => setExpandTooltipOpen(false)}
      enterDelay={500}
      title={expanded ? expandedTitle : collapsedTitle}
    >
      <IconButton
        onClick={() => {
          setExpanded((prev) => !prev);
          setExpandTooltipOpen(false);
        }}
      >
        {expanded ? expandIcons[iconOrientation].expanded : expandIcons[iconOrientation].collapsed}
      </IconButton>
    </Tooltip>
  );
}
