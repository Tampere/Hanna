import { SerializedStyles } from '@emotion/react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Theme } from '@mui/material';

interface Props {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  content: string;
  cancelButtonLabel: string;
  confirmButtonLabel: string;
  cancelButtonVariant?: 'contained' | 'outlined' | 'text';
  confirmButtonVariant?: 'contained' | 'outlined' | 'text';
  cssProp?: (theme: Theme) => SerializedStyles;
}

export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  content,
  cancelButtonLabel,
  confirmButtonLabel,
  cancelButtonVariant = 'outlined',
  confirmButtonVariant = 'outlined',
  cssProp,
}: Props) {
  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <Dialog open={isOpen} css={cssProp}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{content}</DialogContent>
      <DialogActions>
        <Button
          className="delete-dialog-cancel-button"
          variant={cancelButtonVariant}
          onClick={handleCancel}
        >
          {cancelButtonLabel}
        </Button>
        <Button
          className="delete-dialog-confirm-button"
          variant={confirmButtonVariant}
          onClick={handleConfirm}
        >
          {confirmButtonLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
