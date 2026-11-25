import { Error } from '@mui/icons-material';
import { Autocomplete, CircularProgress, TextField, Tooltip } from '@mui/material';
import { ControllerRenderProps, FieldValues } from 'react-hook-form';

import { trpc } from '@frontend/client';
import { HelpTooltip } from '@frontend/components/HelpTooltip';
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
  const selectedWbs = wbsProjects.data?.find((wbs) => wbs.wbsId === props.field.value);
  const isUnknownWbs = !isLoading && Boolean(options) && Boolean(props.field.value) && !selectedWbs;

  return (
    <>
      <Tooltip
        arrow
        title={
          props.field.value
            ? selectedWbs
              ? `${selectedWbs.shortDescription} (${props.field.value})`
              : props.field.value
            : null
        }
      >
        <Autocomplete
          readOnly={props.readonlyProps?.InputProps?.readOnly ?? false}
          autoHighlight
          size="small"
          ref={props.field.ref}
          disabled={!isLoading && !options}
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
              <>
                <TextField
                  {...restParams}
                  {...props.readonlyProps}
                  InputProps={{
                    ...InputProps,
                    ...props.readonlyProps?.InputProps,
                    endAdornment: isLoading ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : (
                      <>
                        {!isLoading && !options && (
                          <HelpTooltip title={tr('projectObject.sapWBSIdNoSAPProjectIdTooltip')} />
                        )}
                        {isUnknownWbs && (
                          <Tooltip placement="top" title={tr('sapWBSSelect.unknownWbs')}>
                            <Error style={{ color: 'orange' }} />
                          </Tooltip>
                        )}
                        {!props.readonlyProps?.InputProps?.readOnly && InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              </>
            );
          }}
        />
      </Tooltip>
    </>
  );
}
