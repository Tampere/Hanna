import { MenuItem, Select } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useState } from 'react';

import { trpc } from '@frontend/client';
import { langAtom } from '@frontend/stores/lang';

import { Code, CodeId } from '@shared/schema/code';

interface Props {
  id?: string;
  codeListId: CodeId['codeListId'];
  value?: string;
  onChange: (newValue: string | null) => void;
  onCancel: () => void;
}

export function TableCodeSelect({ id, codeListId, value, onChange, onCancel }: Props) {
  const codes = trpc.code.get.useQuery({ codeListId }, { staleTime: 60 * 60 * 1000 });
  const lang = useAtomValue(langAtom);

  const [open, setOpen] = useState(true);

  function getLabel(code: Code) {
    return code.text[lang];
  }

  return (
    <Select
      inputProps={{ fontSize: 12 }}
      id={id}
      open={open}
      value={value}
      sx={{ fontSize: 12 }}
      onChange={(e) => {
        onChange(e.target.value);
        setOpen(false);
      }}
      onClose={onCancel}
      fullWidth
    >
      {codes.data?.map((code) => (
        <MenuItem key={code.id.id} value={code.id.id} sx={{ fontSize: 12 }}>
          {getLabel(code)}
        </MenuItem>
      ))}
    </Select>
  );
}
