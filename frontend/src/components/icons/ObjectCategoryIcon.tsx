import { CircularProgress, SvgIcon, Tooltip, css } from '@mui/material';
import { Suspense, forwardRef, lazy } from 'react';

const objectCategoryIcons = {
  '01': 'viheralueet',
  '02': 'tekniset_jarjestelmat',
  '03': 'leikkikentat',
  '04': 'taitorakenteet',
  '05': 'ymparistorakenteet',
  '06': 'satama',
  '07': 'tiet_ja_kadut',
  '08': 'hulevedet',
  '09': 'liikuntareitit',
  '10': 'maa_ja_vesialueet',
};

// Lazy needs to be called outside of a react component
const iconEntries = Object.entries(objectCategoryIcons).map(([id, name]) => [
  id,
  lazy(() => import(`../../assets/icons/${name}.svg?react`)), // vite-plugin-svgr enables importing SVGs as React components,
]);

const objectCategoryIconsMap = Object.fromEntries(iconEntries);

interface Props {
  id: string | null;
  title?: string;
}

export const ObjectCategoryIcon = forwardRef<SVGSVGElement | null, Props>(
  function ObjectCategoryIcon({ id, title }: Props, ref) {
    if (!id) {
      return null;
    }

    const Icon = objectCategoryIconsMap[id];

    return (
      <Suspense
        fallback={
          <CircularProgress
            css={css`
              margin-left: auto;
            `}
            size={15}
          />
        }
      >
        <Tooltip title={title}>
          <SvgIcon ref={ref}>
            <Icon />
          </SvgIcon>
        </Tooltip>
      </Suspense>
    );
  },
);
