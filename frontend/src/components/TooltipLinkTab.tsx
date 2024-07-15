import { Tab, TabProps, Tooltip } from '@mui/material';
import { Link } from 'react-router-dom';

interface Props extends TabProps<typeof Link> {
  title: string;
}

export function TooltipLinkTab(props: Props) {
  return (
    <Tooltip title={props.title}>
      <Tab component={Link} {...props} />
    </Tooltip>
  );
}
