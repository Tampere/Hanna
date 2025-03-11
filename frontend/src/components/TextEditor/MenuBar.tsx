import { FormatListBulleted, FormatListNumbered, Image } from '@mui/icons-material';
import { Box, Button, IconButton, Theme, Tooltip, css } from '@mui/material';
import { Editor } from '@tiptap/react';
import { useRef } from 'react';

import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';

const menuBarStyle = (theme: Theme) => css`
  background-color: rgb(227, 227, 227);
  height: 24px;
  display: flex;
  .MuiButtonBase-root {
    text-transform: capitalize;
    color: #212121;
    font-size: 12px;
    font-weight: 400;
    border: 0.5px solid #c4c4c4;
    border-radius: 0;
    &.is-active {
      background-color: ${theme.palette.primary.main};
      color: white;
    }
  }
`;

interface Props {
  editor: Editor | null;
}

export function MenuBar({ editor }: Props) {
  const tr = useTranslations();
  const notify = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);
  if (!editor) {
    return null;
  }

  const addImage = (files: FileList | null) => {
    if (!files || !files.length) return;

    const file = files[0]; // Get the first file
    const reader = new FileReader();

    reader.onloadend = () => {
      const base64String = reader.result?.toString().split(',')[1]; // Extract Base64
      if (!base64String) return;

      fetch('/api/v1/files/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64String,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (!data.fileid) {
            notify({
              severity: 'error',
              title: tr('menuBar.uploadFailed'),
              duration: 7500,
            });
            return;
          }
          if (editor) {
            editor
              .chain()
              .focus()
              .setImage({ src: `/api/v1/files/${data.fileid}` })
              .run();
          }
        })
        .catch((error) => console.error('Upload failed', error));
    };
    reader.readAsDataURL(file);
  };

  return (
    <Box css={menuBarStyle}>
      <Button
        style={{
          borderTopLeftRadius: '4px',
        }}
        disableTouchRipple
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
      >
        {tr('textEditor.headerTitle')}
      </Button>
      <Button
        disableTouchRipple
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'is-active' : ''}
      >
        {tr('textEditor.boldTitle')}
      </Button>
      <Tooltip title={tr('textEditor.unorderedListTitle')}>
        <IconButton
          disableTouchRipple
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'is-active' : ''}
        >
          <FormatListBulleted />
        </IconButton>
      </Tooltip>
      <Tooltip title={tr('textEditor.orderedListTitle')}>
        <IconButton
          disableTouchRipple
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'is-active' : ''}
        >
          <FormatListNumbered />
        </IconButton>
      </Tooltip>
      <Tooltip title={tr('textEditor.addPicture')}>
        <IconButton
          disableTouchRipple
          tabIndex={-1}
          onClick={() => fileInputRef.current?.click()}
          className={editor.isActive('includeImage') ? 'is-active' : ''}
        >
          <input
            id="fileInput"
            type="file"
            ref={fileInputRef}
            onChange={(event) => addImage(event.target.files)}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <Image />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
