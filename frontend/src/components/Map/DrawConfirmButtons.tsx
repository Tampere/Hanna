import { Close, Save } from '@mui/icons-material';
import { Box, Button, css } from '@mui/material';

import { useTranslations } from '@frontend/stores/lang';

interface Props {
  onSaveClick: () => void;
  onUndoClick: () => void;
}

export function DrawConfirmButtons({ onSaveClick, onUndoClick }: Props) {
  const tr = useTranslations();

  return (
    <Box
      css={css`
        position: absolute;
        bottom: 1rem;
        right: 4rem;
        gap: 8px;
        display: flex;
        flex-direction: column;
        z-index: 200;
      `}
    >
      <Button
        css={(theme) => css`
          color: ${theme.palette.primary.light};
          border-color: ${theme.palette.primary.light};
          background-color: rgb(255, 255, 255, 0.7);
        `}
        variant="outlined"
        onClick={onUndoClick}
        endIcon={<Close />}
      >
        {tr('mapEdit.undoTooltip')}
      </Button>
      <Button variant="contained" onClick={onSaveClick} endIcon={<Save />}>
        {tr('mapEdit.saveTooltip')}
      </Button>
    </Box>
  );
}
