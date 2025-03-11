import Image from '@tiptap/extension-image';
import { JSONContent, generateHTML } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import { TextEditor } from '@frontend/components/TextEditor';

interface Props {
  value: JSONContent;
  onChange: (value: JSONContent) => void;
}

export function GeneralNotificationTextEditor({ value, onChange }: Props) {
  const valueHTML = value
    ? generateHTML(value, [StarterKit, Image.configure({ allowBase64: true })])
    : '';

  return <TextEditor onChange={onChange} content={valueHTML} />;
}
