import { Box, Typography, css } from '@mui/material';
import { useState } from 'react';

import { ConfirmDialog } from '@frontend/components/dialogs/ConfirmDialog';
import { FormCheckBox } from '@frontend/components/forms/FormCheckBox';
import { useTranslations } from '@frontend/stores/lang';

interface Props {
  checked: boolean;
  onChange: (isChecked: boolean) => void;
  forNewProject: boolean;
  projectHasGeom: boolean;
}

export function ProjectAreaSelectorForm({
  checked,
  onChange,
  forNewProject,
  projectHasGeom,
}: Props) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const tr = useTranslations();
  return (
    <Box
      css={css`
        transition: 0.5s ease-out;
        ${forNewProject ? 'border-top: 1px solid #c4c4c4;' : ''}
        padding: 0.5rem;
        display: flex;
        align-items: center;
        gap: 2rem;
      `}
    >
      <Typography variant="overline">{tr('externalProjectFrom.label')}</Typography>
      <FormCheckBox
        onChange={(event) => {
          if (event.target.checked && projectHasGeom) {
            setConfirmDialogOpen(true);
            return;
          }
          onChange(event.target.checked);
        }}
        checked={checked}
        label={tr('externalProjectForm.coversMunicipalityLabel')}
      />
      <ConfirmDialog
        isOpen={confirmDialogOpen}
        cancelButtonLabel={tr('cancel')}
        confirmButtonLabel={tr('continue')}
        title={tr('externalProjectForm.confirmDialog.title')}
        content={tr('externalProjectForm.confirmDialog.content')}
        onConfirm={() => {
          setConfirmDialogOpen(false);
          onChange(true);
        }}
        onCancel={() => {
          setConfirmDialogOpen(false);
        }}
      />
    </Box>
  );
}
