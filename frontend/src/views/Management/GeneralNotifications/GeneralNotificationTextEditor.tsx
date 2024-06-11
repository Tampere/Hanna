import { Clear, Delete, Save } from '@mui/icons-material';
import { Box, Button, css } from '@mui/material';
import { JSONContent, generateHTML } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useState } from 'react';

import { TextEditor } from '@frontend/components/TextEditor';
import { ConfirmDialog } from '@frontend/components/dialogs/ConfirmDialog';
import { useTranslations } from '@frontend/stores/lang';

interface FunctionButtonProps {
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  dirty: boolean;
  disableDelete?: boolean;
}

function FunctionButtons({
  onSave,
  onCancel,
  onDelete,
  dirty,
  disableDelete = false,
}: FunctionButtonProps) {
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
        css={css`
          margin-right: auto;
          color: #ef6c00;
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
        disabled={!dirty}
        onClick={onCancel}
        endIcon={<Clear />}
      >
        {tr('cancel')}
      </Button>
      <Button variant="contained" disabled={!dirty} onClick={onSave} endIcon={<Save />}>
        {tr('genericForm.save')}
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

interface Props {
  value: JSONContent;
  onChange: (value: JSONContent) => void;
  onDelete: () => void;
  disableDelete?: boolean;
}

export function GeneralNotificationTextEditor({
  value,
  onChange,
  onDelete,
  disableDelete = false,
}: Props) {
  const valueHTML = value ? generateHTML(value, [StarterKit]) : '';

  return (
    <TextEditor
      content={valueHTML}
      renderFunctionButtons={(resetEditor, editor, dirty, setDirty) => (
        <FunctionButtons
          disableDelete={disableDelete}
          dirty={dirty}
          onCancel={resetEditor}
          onDelete={onDelete}
          onSave={() => {
            const json = editor.getJSON();
            onChange(json);
            setDirty(false);
          }}
        />
      )}
    />
  );
}
