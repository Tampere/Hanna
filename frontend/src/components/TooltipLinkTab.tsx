import { Tab, TabProps, Tooltip } from '@mui/material';
import { Link } from 'react-router-dom';

interface Props extends TabProps<typeof Link> {
  title: string;
}

export function TooltipLinkTab(props: Props) {
  const { title, ...tabProps } = props;

  // Span used to get tooltip working even without disabled Tab
  return (
    <Tooltip title={title}>
      <span>
        <Tab component={Link} {...tabProps} />
      </span>
    </Tooltip>
  );
}
