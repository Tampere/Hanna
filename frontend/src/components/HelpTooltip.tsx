import { HelpOutline } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';

interface Props {
  title: string;
}

export function HelpTooltip({ title }: Props) {
  return (
    <Tooltip slotProps={{ popper: { style: { zIndex: 1500 } } }} title={title}>
      <IconButton size="small">
        <HelpOutline fontSize="inherit" />
      </IconButton>
    </Tooltip>
  );
}
