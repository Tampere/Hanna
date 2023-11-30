import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Typography,
  css,
} from '@mui/material';
import { useState } from 'react';

import { useTranslations } from '@frontend/stores/lang';

interface Props {
  isOpen: boolean;
  onCancel: () => void;
  onSave: (keepOwnerRights: boolean) => void;
}

export function ProjectOwnerChangeDialog({ isOpen, onCancel, onSave }: Props) {
  const [ownerRightsSelection, setOwnerRightsSelection] = useState(false);
  const tr = useTranslations();

  return (
    <Dialog
      open={isOpen}
      css={css`
        max-width: 400px;
      `}
    >
      <DialogTitle>{tr('projectForm.ownerChangeDialog.title')}</DialogTitle>
      <DialogContent>
        <Typography>{tr('projectForm.ownerChangeDialog.content')}</Typography>
        <FormControlLabel
          label={tr('projectForm.ownerChangeDialog.checkboxLabel')}
          control={
            <Checkbox
              checked={ownerRightsSelection}
              onChange={() => setOwnerRightsSelection(!ownerRightsSelection)}
            />
          }
        />
      </DialogContent>
      <DialogActions>
        <Button sx={{ mt: '1rem' }} variant="text" color="error" onClick={onCancel}>
          {tr('cancel')}
        </Button>
        <Button
          sx={{ mt: '1rem' }}
          variant="contained"
          onClick={() => {
            onSave(ownerRightsSelection);
          }}
        >
          {tr('genericForm.saveChanges')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
