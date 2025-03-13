import Image from '@tiptap/extension-image';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface Props {
  content: string;
}

export function GeneralNotificationCard({ content }: Props) {
  const editor = useEditor({
    editable: false,
    content: content,
    extensions: [StarterKit, Image],
  });
  if (!editor) {
    return null;
  }
  return <EditorContent editor={editor} />;
}
