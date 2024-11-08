import { Close } from '@mui/icons-material';
import { Box, IconButton, Typography, css } from '@mui/material';
import { useAtom } from 'jotai';

import { useTranslations } from '@frontend/stores/lang';
import { noGeomInfoBoxAtom } from '@frontend/stores/map';

interface Props {
  drawItemType: 'project' | 'projectObject';
  isVisible: boolean;
}

export function NoGeomInfoBox(props: Props) {
  const [available, setAvailable] = useAtom(noGeomInfoBoxAtom);
  const tr = useTranslations();

  if (!available || !props.isVisible) {
    return null;
  }

  return (
    <Box
      css={css`
        --container-width: 420px;
        background-color: #ffffff99;
        position: absolute;
        left: calc(50% - var(--container-width) / 2);
        top: calc(50% - var(--container-width) / 2);
        width: var(--container-width);
        padding: 3em 2em;
      `}
    >
      <Typography
        css={css`
          font-weight: 500;
          font-size: 36px;
          text-align: center;
          color: #848484;
          line-height: 34px;
        `}
      >
        {props.drawItemType === 'project'
          ? tr('map.noProjectGeometry')
          : tr('map.noProjectObjectGeometry')}
      </Typography>
      <IconButton
        onClick={() => setAvailable(false)}
        css={css`
          position: absolute;
          top: 2px;
          right: 2px;
        `}
      >
        <Close />
      </IconButton>
    </Box>
  );
}
