import { HelpOutline } from '@mui/icons-material';
import { IconButton, Tooltip, TooltipProps } from '@mui/material';

interface Props {
  title: string;
  color?: string;
  placement?: TooltipProps['placement'];
}

export function HelpTooltip({ title, color, placement = 'bottom' }: Props) {
  return (
    <Tooltip
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
