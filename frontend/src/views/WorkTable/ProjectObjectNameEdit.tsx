import { InputBase } from '@mui/material';
import { useEffect, useState } from 'react';

interface Props {
  value: string;
  onChange: (newValue: string) => void;
}

export function ProjectObjectNameEdit({ value, onChange }: Props) {
  const [newValue, setNewValue] = useState<string>(value);

  useEffect(() => {
    setNewValue(value);
  }, [value]);

  return (
    <InputBase
      fullWidth
      multiline
      rows={2}
      style={{ fontSize: 12, padding: 8 }}
      value={newValue}
      onChange={(event) => setNewValue(event.target.value)}
      onKeyDown={(event) => {
        if (event.code === 'Enter' || event.code === 'Tab') {
          onChange(newValue);
        }
      }}
      size="small"
      autoFocus
      onFocus={(event) =>
        event.target.setSelectionRange(event.target.value.length, event.target.value.length)
      }
    />
  );
}
