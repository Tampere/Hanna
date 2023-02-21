import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { ControllerRenderProps, FieldValues } from 'react-hook-form';

import { trpc } from '@frontend/client';
import { useTranslations } from '@frontend/stores/lang';

interface Props {
  projectId: string;
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
  const wbsProjects = trpc.sap.getWBSByProjectId.useQuery({ projectId: props.projectId });

  const options = wbsProjects.data?.map((wbs) => wbs.wbsId);

  return (
    <Autocomplete
      autoHighlight
      size="small"
      ref={props.field.ref}
      value={props.field.value}
      onChange={(_, value) => props.field.onChange(value)}
      options={options ?? []}
      noOptionsText={tr('sapWBSSelect.noOptions')}
      getOptionLabel={(id) => {
        const wbs = wbsProjects.data?.find((wbs) => wbs.wbsId === id);
        return `${wbs?.shortDescription} (${wbs?.wbsId})`;
      }}
      renderInput={(params) => {
        const { InputProps, ...restParams } = params;
        return (
          <TextField
            {...restParams}
            InputProps={{
              ...InputProps,
              endAdornment: wbsProjects.isLoading ? (
                <CircularProgress color="inherit" size={20} />
              ) : (
                InputProps.endAdornment
              ),
            }}
            {...props.readonlyProps}
            {...props.field}
          />
        );
      }}
    />
  );
}
