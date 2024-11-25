import { CircularProgress, MenuItem, Select, css } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useState } from 'react';

import { trpc } from '@frontend/client';
import { langAtom } from '@frontend/stores/lang';

interface Props {
  projectId: string;
  id?: string;
  value?: string;
  onChange: (newValue: string | null) => void;
  onCancel: () => void;
}

export function CommitteeCodeSelect({ projectId, id, value, onChange, onCancel }: Props) {
  const projectCommittees = trpc.project.getCommittees.useQuery({ projectId: projectId ?? '' });

  const lang = useAtomValue(langAtom);

  const [open, setOpen] = useState(true);

  if (projectCommittees.isLoading) {
    return (
      <CircularProgress
        size={20}
        css={css`
          margin: 0 auto;
        `}
      />
    );
  }

  return (
    <>
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
        {projectCommittees.data?.map((committee) => (
          <MenuItem key={committee.id.id} value={committee.id.id} sx={{ fontSize: 12 }}>
            {committee.text[lang]}
          </MenuItem>
        ))}
      </Select>
    </>
  );
}
