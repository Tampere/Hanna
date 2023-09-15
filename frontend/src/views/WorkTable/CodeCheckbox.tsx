import { Box, Button, Checkbox, ListItemText, MenuItem, Select, Theme, css } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useState } from 'react';

import { trpc } from '@frontend/client';
import { langAtom, useTranslations } from '@frontend/stores/lang';

import { Code, CodeId } from '@shared/schema/code';

interface Props {
  id?: string;
  codeListId: CodeId['codeListId'];
  value: string[];
  onChange: (newValue: string[] | null) => void;
  onCancel: () => void;
}

const FONT_SIZE = 12;

export function TableCodeCheckbox({ id, codeListId, value, onChange, onCancel }: Props) {
  const codes = trpc.code.get.useQuery({ codeListId }, { staleTime: 60 * 60 * 1000 });
  const lang = useAtomValue(langAtom);
  const tr = useTranslations();

  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState<string[]>(value);

  function getLabel(code: Code) {
    return code.text[lang];
  }

  return (
    <Select
      css={css`
        align-self: flex-end;
      `}
      id={id}
      open={open}
      multiple
      onClose={onCancel}
      value={selected || []}
      sx={{ fontSize: FONT_SIZE }}
      onChange={(e) => setSelected(e.target.value as string[])}
      renderValue={(selected) => selected.length + ' ' + tr('genericForm.selectionCount')}
      MenuProps={{
        onClick: (e) => e.preventDefault(),
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'right',
        },
        transformOrigin: {
          vertical: 'top',
          horizontal: 'right',
        },
      }}
      fullWidth
    >
      {codes.data?.map((code) => (
        <MenuItem
          css={(theme: Theme) => css`
            font-size: ${FONT_SIZE} px;
            padding: ${theme.spacing(0, 1)};
          `}
          key={code.id.id}
          value={code.id.id}
          onKeyDown={(e) => {
            // select with space
            if (e.code === 'Space') {
              setSelected((prev) => {
                if (prev.includes(code.id.id)) {
                  return prev.filter((id) => id !== code.id.id);
                } else {
                  return [...prev, code.id.id];
                }
              });
            }
            // commit selected with enter or tab
            if (e.code === 'Enter' || e.code === 'Tab') {
              e.stopPropagation();
              if (selected.length > 0) {
                onChange(selected);
                setOpen(false);
              }
            }
          }}
          disableRipple
        >
          <Checkbox disableRipple size="small" checked={selected?.includes(code.id.id) ?? false} />
          <ListItemText sx={{ fontSize: FONT_SIZE }} primary={getLabel(code)} disableTypography />
        </MenuItem>
      ))}
      <Box
        css={(theme: Theme) => css`
          display: flex;
          justify-content: space-around;
          padding-top: ${theme.spacing(2)};
          padding-bottom: ${theme.spacing(1)};
        `}
      >
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            onCancel();
            setOpen(false);
          }}
        >
          {tr('cancel')}
        </Button>
        <Button
          variant="contained"
          size="small"
          disabled={selected.length === 0}
          title="foo"
          onClick={() => {
            onChange(selected);
            setOpen(false);
          }}
        >
          {tr('genericForm.accept')}
        </Button>
      </Box>
    </Select>
  );
}
