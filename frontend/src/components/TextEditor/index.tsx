import { Box, CssBaseline, css } from '@mui/material';
import { EditorContent, JSONContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ReactElement } from 'react';

import { MenuBar } from './MenuBar';
import './styles.css';

const extensions = [StarterKit];

interface Props {
  content: string;
  renderFunctionButtons?: () => ReactElement;
  onChange: (content: JSONContent) => void;
}

export function TextEditor({ content, renderFunctionButtons, onChange }: Props) {
  const editor = useEditor({
    editable: true,
    extensions,
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <CssBaseline>
      <Box
        css={css`
          border: solid 0.5px #c4c4c4;
          border-radius: 4px;
        `}
      >
        <MenuBar editor={editor} />
        <EditorContent editor={editor} />
      </Box>
      {renderFunctionButtons?.()}
    </CssBaseline>
  );
}
