import { SerializedStyles } from '@emotion/react';
import { CircularProgress, SvgIcon, Tooltip } from '@mui/material';
import { Suspense, forwardRef, lazy } from 'react';

const objectStageIcons = {
  '01': 'suunnittelu',
  '02': 'rakentaminen',
};

// Lazy needs to be called outside of a react component
const iconEntries = Object.entries(objectStageIcons).map(([id, name]) => [
  id,
  lazy(() => import(`../../assets/icons/${name}.svg?react`)), // vite-plugin-svgr enables importing SVGs as React components,
]);

const objectStageIconMap = Object.fromEntries(iconEntries);

interface Props {
  id: string | null;
  title?: string;
  cssProp?: SerializedStyles;
}

// forwardRef needed for tooltip to work
export const ObjectStageIcon = forwardRef<SVGSVGElement | null, Props>(
  function ObjectStageIcon(props, ref) {
    const { id, title, cssProp } = props;
    if (!id) return null;

    const Icon = objectStageIconMap[id];

    return (
      <Suspense fallback={<CircularProgress {...(cssProp && { css: cssProp })} size={15} />}>
        <Tooltip title={title} placement="top">
          <SvgIcon
            ref={ref}
            {...(cssProp && {
              css: cssProp,
            })}
          >
            <Icon />
          </SvgIcon>
        </Tooltip>
      </Suspense>
    );
  },
);
