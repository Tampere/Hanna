import { Check } from '@mui/icons-material';
import { Box, Checkbox, FormControlLabel, Typography, css } from '@mui/material';
import { PropsWithChildren, useState } from 'react';

import { ConfirmDialog } from '@frontend/components/dialogs/ConfirmDialog';
import { useTranslations } from '@frontend/stores/lang';

function CheckBoxBorderIcon(props: PropsWithChildren) {
  return (
    <span
      css={(theme) => css`
        input:hover ~ & {
          border-color: ${theme.palette.primary.main};
          box-shadow: 0 0 0 0.5px rgb(0 0 0 / 20%);
        }
        width: 24px;
        height: 24px;
        border-radius: 4px;
        border: 0.5px solid #c4c4c4;
        display: flex;
        justify-content: center;
        align-items: center;
      `}
    >
      {props.children}
    </span>
  );
}

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
      <FormControlLabel
        control={
          <Checkbox
            checked={checked}
            onChange={(event) => {
              if (event.target.checked && projectHasGeom) {
                setConfirmDialogOpen(true);
                return;
              }
              onChange(event.target.checked);
            }}
            disableRipple
            icon={<CheckBoxBorderIcon />}
            checkedIcon={
              <CheckBoxBorderIcon>
                <Check
                  css={(theme) => css`
                    font-size: 18px;
                    color: ${theme.palette.primary.dark};
                  `}
                />
              </CheckBoxBorderIcon>
            }
            css={css`
              background-color: #fff;
            `}
          />
        }
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
