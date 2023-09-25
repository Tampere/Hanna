import { css } from '@emotion/react';
import {
  Autocomplete,
  Box,
  FormLabel,
  LinearProgress,
  Paper,
  Popper,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';

import { trpc } from '@frontend/client';
import { useTranslations } from '@frontend/stores/lang';

import type { UpsertProjectObject } from '@shared/schema/projectObject';

interface Value {
  rakennuttajaUser: UpsertProjectObject['rakennuttajaUser'];
  suunnitteluttajaUser: UpsertProjectObject['suunnitteluttajaUser'];
}

interface Props {
  value: Value;
  onChange: (value: Value) => void;
}

/**
 * ProjectObjectUsers component for the DataGrid
 * @param {Object} props - Properties passed to component
 * @param {Value} props.value - The value of the project object users
 */

export function ProjectObjectUsers({ value }: { value: Value }) {
  // When DataGrid is scrolled, users are not constantly refetched over and over again
  const users = trpc.user.getAll.useQuery(undefined, { staleTime: 5 * 60 * 60 });

  return (
    <Box
      css={(theme) => css`
        display: flex;
        flex-direction: column;
        padding: ${theme.spacing(1)} 0;
      `}
    >
      <span>{users.data?.find(({ id }) => id === value.rakennuttajaUser)?.name}</span>
      <span>{users.data?.find(({ id }) => id === value.suunnitteluttajaUser)?.name}</span>
    </Box>
  );
}

export function ProjectObjectUserEdit({ value, onChange }: Props) {
  const tr = useTranslations();
  const anchorElRef = useRef<HTMLDivElement>(null);
  const users = trpc.user.getAll.useQuery();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (anchorElRef.current) {
      setOpen(true);
    }
  }, [anchorElRef.current]);

  return (
    <Box ref={anchorElRef} position={'absolute'} sx={{ p: 1 }}>
      <ProjectObjectUsers value={value} />
      <Popper open={open} anchorEl={anchorElRef.current?.parentElement} placement={'bottom-end'}>
        {open && users.isLoading && (
          <Paper sx={{ p: 1 }}>
            <Typography>
              {tr('loading')}
              <LinearProgress />
            </Typography>
          </Paper>
        )}
        {open && !users.isLoading && (
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
                  flex-direction: row;
                  gap: 16px;
                `}
              >
                <div
                  css={css`
                    flex: 1;
                  `}
                >
                  <FormLabel sx={{ fontSize: 12 }}>
                    {tr('projectObject.rakennuttajaUserLabel')}
                  </FormLabel>
                  <Autocomplete
                    autoFocus
                    disableClearable
                    options={users.data ?? []}
                    renderInput={(params) => (
                      <TextField {...params} InputProps={{ ...params.InputProps, size: 'small' }} />
                    )}
                    multiple={false}
                    getOptionLabel={(user) => user.name}
                    value={users.data?.find((user) => user.id === value.rakennuttajaUser)}
                    onChange={(_event, newValue) =>
                      onChange({ ...value, rakennuttajaUser: newValue.id })
                    }
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
