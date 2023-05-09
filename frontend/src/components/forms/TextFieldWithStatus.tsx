import { Check, Error, Warning } from '@mui/icons-material';
import { CircularProgress, TextField, TextFieldProps, Tooltip } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import { useDebounce } from '@frontend/utils/useDebounce';

type Status = 'empty' | 'valid' | 'loading' | 'invalid' | 'error';

type Props = TextFieldProps & {
  value: string;
  validate: (value: string) => Promise<boolean>;
  messages: Record<Exclude<Status, 'empty'>, string>;
  onStatusChange?: (status: Status) => void;
  debounceDelayMs?: number;
};

export function TextFieldWithStatus(props: Props) {
  const {
    validate,
    onStatusChange,
    debounceDelayMs = 500,
    messages: tooltipMessages,
    ...TextFieldProps
  } = props;
  const [status, setStatus] = useState<Status>('empty');

  const debouncedValue = useDebounce(props.value, debounceDelayMs);

  useEffect(() => {
    async function runValidate() {
      if (!debouncedValue.length) {
        setStatus('empty');
        return;
      }
      setStatus('loading');
      try {
        const isValid = await validate(props.value);
        setStatus(isValid ? 'valid' : 'invalid');
      } catch (error) {
        setStatus('error');
      }
    }
    runValidate();
  }, [debouncedValue]);

  useEffect(() => {
    if (!props.value?.length) {
      setStatus('empty');
    } else {
      setStatus('loading');
    }
  }, [props.value]);

  useEffect(() => {
    onStatusChange?.(status);
  }, [status]);

  const statusIcon = useMemo(() => {
    switch (status) {
      case 'error':
        return (
          <Tooltip title={tooltipMessages.error}>
            <Warning style={{ color: 'red' }} />
          </Tooltip>
        );
      case 'invalid':
        return (
          <Tooltip title={tooltipMessages.invalid}>
            <Error style={{ color: 'orange' }} />
          </Tooltip>
        );
      case 'valid':
        return (
          <Tooltip title={tooltipMessages.valid}>
            <Check style={{ color: 'green' }} />
          </Tooltip>
        );
      case 'loading':
        return (
          <Tooltip title={tooltipMessages.loading}>
            <div style={{ display: 'flex' }}>
              <CircularProgress size={20} />
            </div>
          </Tooltip>
        );
    }
  }, [status, tooltipMessages]);

  return (
    <TextField
      {...TextFieldProps}
      InputProps={{
        ...TextFieldProps.InputProps,
        endAdornment: statusIcon,
      }}
    />
  );
}
