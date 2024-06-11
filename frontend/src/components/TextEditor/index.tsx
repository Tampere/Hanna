import { EmotionJSX } from '@emotion/react/types/jsx-namespace';
import { Box, CssBaseline } from '@mui/material';
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
      <Box className="editor-container">
        <MenuBar editor={editor} />
        <EditorContent editor={editor} />
      </Box>
      {renderFunctionButtons?.(resetEditor, editor, dirty, setDirty)}
    </CssBaseline>
  );
}
