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
import { useAtomValue } from 'jotai';

import { trpc } from '@frontend/client';
import { asyncUserAtom } from '@frontend/stores/auth';
import { useTranslations } from '@frontend/stores/lang';

import { isAdmin } from '@shared/schema/userPermissions';

interface Props {
  newOwnerId: string;
  isOpen: boolean;
  onCancel: () => void;
  onSave: (keepOwnerRights: boolean) => void;
  keepOwnerRights: boolean;
  setKeepOwnerRights: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ProjectOwnerChangeDialog({
  isOpen,
  onCancel,
  onSave,
  newOwnerId,
  keepOwnerRights,
  setKeepOwnerRights,
}: Props) {
  const tr = useTranslations();
  const loggedUser = useAtomValue(asyncUserAtom);
  const user = trpc.user.get.useQuery({ userId: newOwnerId });

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
        {!isAdmin(loggedUser.role) && (
          <Typography>{tr('projectForm.ownerChangeDialog.firstContent')}</Typography>
        )}

        {user.data && (
          <Typography>
            {tr('projectForm.ownerChangeDialog.newOwner')}&nbsp;
            <b>{user.data.name}</b>.
          </Typography>
        )}
        {!isAdmin(loggedUser.role) && (
          <Typography
            css={css`
              font-weight: bold;
            `}
          >
            {tr('projectForm.ownerChangeDialog.secondContent')}
          </Typography>
        )}
        <FormControlLabel
          css={css`
            margin-left: 0.25rem;
          `}
          label={tr('projectForm.ownerChangeDialog.checkboxLabel')}
          control={
            <Checkbox
              checked={keepOwnerRights}
              onChange={() => setKeepOwnerRights(!keepOwnerRights)}
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
            onSave(keepOwnerRights);
          }}
        >
          {tr('ok')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
