import { Clear, Delete, Save } from '@mui/icons-material';
import { Box, Button, css } from '@mui/material';
import { useState } from 'react';

import { ConfirmDialog } from '@frontend/components/dialogs/ConfirmDialog';
import { useTranslations } from '@frontend/stores/lang';

interface Props {
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  dirty: boolean;
  disableDelete?: boolean;
  isPublished: boolean;
}

export function FormFunctionButtons({
  onSave,
  onCancel,
  onDelete,
  dirty,
  disableDelete = false,
  isPublished,
}: Props) {
  const tr = useTranslations();
  const [displayConfirmDialog, setDisplayConfirmDialog] = useState(false);

  return (
    <Box
      css={css`
        margin: 0.5rem 0;
        display: flex;
        gap: 0.5rem;
      `}
    >
      <Button
        onClick={() => setDisplayConfirmDialog(true)}
        disabled={disableDelete}
        css={(theme) => css`
          margin-right: auto;
          color: ${theme.palette.secondary.main};
        `}
        endIcon={<Delete />}
      >
        {tr('delete')}
      </Button>
      <Button
        css={(theme) => css`
          color: ${theme.palette.primary.light};
          border-color: ${theme.palette.primary.light};
        `}
        variant="outlined"
        onClick={onCancel}
        endIcon={<Clear />}
      >
        {tr('cancel')}
      </Button>
      <Button
        css={css`
          width: 130px;
        `}
        variant="contained"
        disabled={!dirty}
        onClick={onSave}
        endIcon={<Save />}
      >
        {isPublished ? tr('genericForm.save') : tr('generalNotificationForm.publish')}
      </Button>
      <ConfirmDialog
        cssProp={(theme) => css`
          & .delete-dialog-confirm-button {
            background-color: ${theme.palette.secondary.main};
          }
        `}
        isOpen={displayConfirmDialog}
        title={tr('generalNotifications.deleteDialogTitle')}
        onCancel={() => setDisplayConfirmDialog(false)}
        onConfirm={onDelete}
        content={tr('generalNotifications.deleteDialogContent')}
        cancelButtonVariant="contained"
        confirmButtonVariant="contained"
        cancelButtonLabel={tr('genericForm.undoBtnLabel')}
        confirmButtonLabel={tr('genericForm.deleteBtnLabel')}
      />
    </Box>
  );
}
