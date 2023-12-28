import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

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
}: Props) {
  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <Dialog open={isOpen}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{content}</DialogContent>
      <DialogActions>
        <Button variant={cancelButtonVariant} onClick={handleCancel}>
          {cancelButtonLabel}
        </Button>
        <Button variant={confirmButtonVariant} onClick={handleConfirm}>
          {confirmButtonLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
