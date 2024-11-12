import { SerializedStyles } from '@emotion/react';
import { Tab, TabProps, Tooltip } from '@mui/material';
import { Link } from 'react-router-dom';

interface Props extends TabProps<typeof Link> {
  title: string;
  cssProp?: SerializedStyles;
}

export function TooltipLinkTab(props: Props) {
  const { title, ...tabProps } = props;

  // Span used to get tooltip working even without disabled Tab
  return (
    <Tooltip title={title} {...(props.cssProp && { css: props.cssProp })}>
      <span>
        <Tab component={Link} {...tabProps} />
      </span>
    </Tooltip>
  );
}
