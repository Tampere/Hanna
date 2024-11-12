import { Close } from '@mui/icons-material';
import { Box, IconButton, Typography, css } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';

import { useTranslations } from '@frontend/stores/lang';
import { projectEditingAtom } from '@frontend/stores/projectView';

interface Props {
  drawItemType: 'project' | 'projectObject';
  isVisible: boolean;
}

export function NoGeomInfoBox(props: Props) {
  const { projectId, projectObjectId } = useParams() as {
    projectId: string;
    projectObjectId?: string;
  };

  const isNewItem =
    (props.drawItemType === 'project' && !projectId) ||
    (props.drawItemType === 'projectObject' && !projectObjectId);

  const [isVisible, setIsVisible] = useState(props.isVisible && !isNewItem);
  const editing = useAtomValue(projectEditingAtom);

  const tr = useTranslations();

  useEffect(() => {
    if ((editing || !props.isVisible) && isVisible) setIsVisible(false);
  }, [editing, props.isVisible]);

  if (editing || !isVisible) {
    return null;
  }

  return (
    <Box
      css={css`
        --container-width: 420px;
        --container-height: 165px;
        background-color: #ffffffbf;
        position: absolute;
        left: calc(50% - var(--container-width) / 2);
        top: calc(50% - var(--container-height) / 2);
        width: var(--container-width);
        height: var(--container-height);
        padding: 3em 2em;
      `}
    >
      <Typography
        css={css`
          font-weight: 500;
          font-size: 36px;
          text-align: center;
          color: #6f6f6f;
          line-height: 34px;
        `}
      >
        {props.drawItemType === 'project'
          ? tr('map.noProjectGeometry')
          : tr('map.noProjectObjectGeometry')}
      </Typography>
      <IconButton
        onClick={() => setIsVisible(false)}
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
