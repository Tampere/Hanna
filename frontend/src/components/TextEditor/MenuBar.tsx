import { FormatListBulleted, FormatListNumbered } from '@mui/icons-material';
import { Box, Button, IconButton, Theme, Tooltip, css } from '@mui/material';
import { Editor } from '@tiptap/react';

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

  if (!editor) {
    return null;
  }

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
    </Box>
  );
}
