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

import { trpc } from '@frontend/client';
import { useTranslations } from '@frontend/stores/lang';

interface Props {
  newOwnerId: string;
  isOpen: boolean;
  onCancel: () => void;
  onSave: (keepOwnerRights: boolean) => void;
}

export function ProjectOwnerChangeDialog({ isOpen, onCancel, onSave, newOwnerId }: Props) {
  const [ownerRightsSelection, setOwnerRightsSelection] = useState(false);

  const tr = useTranslations();

  const user = trpc.user.get.useQuery({ userId: newOwnerId });
  console.log(user);
  return (
    <Dialog
      open={isOpen}
      css={css`
        & .MuiPaper-root {
          min-width: 450px;
        }
      `}
    >
      <DialogTitle>{tr('projectForm.ownerChangeDialog.title')}</DialogTitle>
      <DialogContent>
        <Typography>{tr('projectForm.ownerChangeDialog.firstContent')}</Typography>

        {user.data && (
          <Typography>
            {tr('projectForm.ownerChangeDialog.newOwner')}&nbsp;
            <b>{user.data.name}</b>.
          </Typography>
        )}
        <Typography
          css={css`
            font-weight: bold;
          `}
        >
          {tr('projectForm.ownerChangeDialog.secondContent')}
        </Typography>
        <FormControlLabel
          css={css`
            margin-left: 0.25rem;
          `}
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
        <Button variant="text" color="primary" onClick={onCancel}>
          {tr('cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            onSave(ownerRightsSelection);
          }}
        >
          {tr('ok')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
