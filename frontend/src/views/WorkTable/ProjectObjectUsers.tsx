import { css } from '@emotion/react';
import { FormLabel, Paper, Popper } from '@mui/material';
import { Box } from '@mui/system';
import { useEffect, useRef, useState } from 'react';

import { UserSelect } from '@frontend/components/forms/UserSelect';
import { useTranslations } from '@frontend/stores/lang';

// FIXME: from upsertprojectobject after rebasing
interface Props {
  value: {
    rakennuttajaUser: string;
    suunnittelluttajaUser: string;
  };
  onChange: (value: { rakennuttajaUser: string; suunnittelluttajaUser: string }) => void;
}
export function ProjectObjectUserEdit({ value, onChange }: Props) {
  const anchorElRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);

  const tr = useTranslations();

  useEffect(() => {
    if (anchorElRef.current) {
      setOpen(true);
    }
  }, [anchorElRef.current]);

  return (
    <Box ref={anchorElRef} position={'absolute'}>
      <Box
        css={(theme) => css`
          display: flex;
          flex-direction: column;
          padding: ${theme.spacing(1)};
        `}
      >
        <i>{value.rakennuttajaUser}</i>
        <i>{value.suunnitteluttajaUser}</i>
      </Box>
      <Popper open={open} anchorEl={anchorElRef.current?.parentElement} placement={'bottom-end'}>
        {open && (
          <>
            <Paper
              css={(theme) => css`
                font-size: 11px;
                min-width: 420px;
                display: flex;
                flex-direction: column;
                padding: ${theme.spacing(2)};
              `}
            >
              <div
                css={css`
                  display: flex;
                  flex: 1;
                  flex-direction: row;
                  gap: 16px;
                `}
              >
                <div
                  css={css`
                    flex: 1;
                  `}
                >
                  <FormLabel sx={{ fontSize: 12 }}>{tr('projectObject.rakennuttaja')}</FormLabel>
                  <UserSelect
                    value={value.rakennuttajaUser}
                    onChange={(newValue) => {
                      onChange({
                        ...value,
                        rakennuttajaUser: newValue,
                      });
                    }}
                  />
                </div>
                <div
                  css={css`
                    flex: 1;
                  `}
                >
                  <FormLabel sx={{ fontSize: 12 }}>
                    {tr('projectObject.suunnitteluttajaUserLabel')}
                  </FormLabel>
                  <Autocomplete
                    disableClearable
                    options={users.data ?? []}
                    renderInput={(params) => (
                      <TextField {...params} InputProps={{ ...params.InputProps, size: 'small' }} />
                    )}
                    multiple={false}
                    getOptionLabel={(user) => user.name}
                    value={users.data?.find((user) => user.id === value.suunnitteluttajaUser)}
                    onChange={(_event, newValue) =>
                      onChange({ ...value, suunnitteluttajaUser: newValue.id })
                    }
                  />
                </div>
              </div>
            </Paper>
          </>
        )}
      </Popper>
    </Box>
  );
}
