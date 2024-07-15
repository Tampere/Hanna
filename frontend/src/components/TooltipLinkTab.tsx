import { Tab, TabProps, Tooltip } from '@mui/material';
import { Link } from 'react-router-dom';

interface Props extends TabProps<typeof Link> {
  title: string;
}

export function TooltipLinkTab(props: Props) {
  const { title, ...tabProps } = props;
  return (
    <Tooltip title={title}>
      <Tab component={Link} {...tabProps} />
    </Tooltip>
  );
}
