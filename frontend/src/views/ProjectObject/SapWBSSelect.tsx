import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { ControllerRenderProps, FieldValues } from 'react-hook-form';

import { trpc } from '@frontend/client';
import { useTranslations } from '@frontend/stores/lang';

interface Props {
  projectId?: string;
  readonlyProps?: {
    hiddenLabel?: boolean;
    variant?: 'filled';
    InputProps?: {
      readOnly: boolean;
    };
  };
  field: ControllerRenderProps<FieldValues, string> & { id?: string };
}

export function SapWBSSelect(props: Props) {
  const tr = useTranslations();
  const isEnabled = Boolean(props.projectId);
  const wbsProjects = trpc.sap.getWBSByProjectId.useQuery(
    { projectId: props.projectId ?? '' },
    { enabled: isEnabled },
  );

  const isLoading = isEnabled && wbsProjects.isLoading;
  const options = wbsProjects.data?.map((wbs) => wbs.wbsId);

  return (
    <Autocomplete
      readOnly={props.readonlyProps?.InputProps?.readOnly ?? false}
      autoHighlight
      size="small"
      ref={props.field.ref}
      value={props.field.value ?? null}
      onChange={(_, value) => props.field.onChange(value)}
      options={options ?? []}
      noOptionsText={tr('sapWBSSelect.noOptions')}
      getOptionLabel={(id) => {
        const wbs = wbsProjects.data?.find((wbs) => wbs.wbsId === id);
        if (!wbs) return id;
        return `${wbs?.shortDescription} (${wbs?.wbsId})`;
      }}
      renderInput={(params) => {
        const { InputProps, ...restParams } = params;
        return (
          <TextField
            {...restParams}
            InputProps={{
              ...InputProps,
              endAdornment: isLoading ? (
                <CircularProgress color="inherit" size={20} />
              ) : (
                InputProps.endAdornment
              ),
            }}
            {...props.readonlyProps}
          />
        );
      }}
    />
  );
}
