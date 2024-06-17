import { EmotionJSX } from '@emotion/react/types/jsx-namespace';
import { Box, CssBaseline, css } from '@mui/material';
import { Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useState } from 'react';

import { MenuBar } from './MenuBar';
import './styles.css';

const extensions = [StarterKit];

interface Props {
  content: string;
  renderFunctionButtons: (
    resetEditor: () => void,
    editor: Editor,
    dirty: boolean,
    setDirty: React.Dispatch<React.SetStateAction<boolean>>,
  ) => EmotionJSX.Element;
}

export function TextEditor({ content, renderFunctionButtons }: Props) {
  const [dirty, setDirty] = useState(false);

  function resetEditor() {
    editor?.commands.setContent(content);
    setDirty(false);
  }

  const editor = useEditor({
    editable: true,
    extensions,
    content: content,
    onUpdate: () => {
      if (!dirty) setDirty(true);
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
      {renderFunctionButtons?.(resetEditor, editor, dirty, setDirty)}
    </CssBaseline>
  );
}
