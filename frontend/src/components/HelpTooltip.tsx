import { SerializedStyles } from '@emotion/react';
import { HelpOutline } from '@mui/icons-material';
import { IconButton, Tooltip, TooltipProps, tooltipClasses } from '@mui/material';

interface Props {
  title: string | JSX.Element;
  color?: string;
  placement?: TooltipProps['placement'];
  cssProp?: SerializedStyles;
  componentProps?: TooltipProps['componentsProps'];
}

export function HelpTooltip({
  title,
  color,
  cssProp,
  componentProps,
  placement = 'bottom',
}: Props) {
  return (
    <Tooltip
      {...(componentProps && { componentsProps: componentProps })}
      {...(cssProp && { css: cssProp })}
      color={color ?? 'inherit'}
      slotProps={{ popper: { style: { zIndex: 1500 } } }}
      title={title}
      placement={placement}
    >
      <IconButton size="small">
        <HelpOutline fontSize="inherit" />
      </IconButton>
    </Tooltip>
  );
}
