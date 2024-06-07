import { Check, Error, Warning } from '@mui/icons-material';
import { CircularProgress, TextField, TextFieldProps, Tooltip, css } from '@mui/material';
import { forwardRef, useEffect, useMemo, useState } from 'react';

import { useDebounce } from '@frontend/utils/useDebounce';

type Status = 'empty' | 'valid' | 'loading' | 'invalid' | 'error';

type Props = TextFieldProps & {
  value: string;
  validate: (value: string) => Promise<boolean>;
  messages: Record<Exclude<Status, 'empty'>, string>;
  onStatusChange?: (status: Status) => void;
  debounceDelayMs?: number;
};

interface TooltipState {
  isOpen: boolean;
  timeoutRef: NodeJS.Timeout | null;
}

export const TextFieldWithStatus = forwardRef(function TextFieldWithStatus(
  props: Props,
  ref: React.ForwardedRef<HTMLDivElement | null>,
) {
  const {
    validate,
    onStatusChange,
    debounceDelayMs = 500,
    messages: tooltipMessages,
    ...TextFieldProps
  } = props;
  const [status, setStatus] = useState<Status>('empty');
  const [tooltip, setTooltip] = useState<TooltipState>({ isOpen: false, timeoutRef: null });

  const debouncedValue = useDebounce(props.value, debounceDelayMs);

  function displayTooltip(duration: number) {
    setTooltip((prev) => {
      clearTimeout(prev.timeoutRef ?? undefined);
      return {
        isOpen: true,
        timeoutRef: setTimeout(() => setTooltip({ isOpen: false, timeoutRef: null }), duration),
      };
    });
  }

  function getClosedTooltipState(prev: TooltipState) {
    if (prev.timeoutRef) clearTimeout(prev.timeoutRef);
    return { isOpen: false, timeoutRef: null };
  }

  function getOpenedTooltipState(prev: TooltipState) {
    if (prev.timeoutRef) clearTimeout(prev.timeoutRef);
    return { isOpen: true, timeoutRef: null };
  }

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
        if (!isValid) {
          displayTooltip(3000);
        }
      } catch (error) {
        setStatus('error');
        displayTooltip(3000);
      }
    }
    runValidate();
  }, [debouncedValue]);

  useEffect(() => {
    setTooltip(getClosedTooltipState);
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
          <Tooltip
            placement="top"
            open={tooltip.isOpen}
            onClose={() => setTooltip(getClosedTooltipState)}
            onOpen={() => setTooltip(getOpenedTooltipState)}
            title={tooltipMessages.error}
          >
            <Warning style={{ color: 'red' }} />
          </Tooltip>
        );
      case 'invalid':
        return (
          <Tooltip
            placement="top"
            open={tooltip.isOpen}
            onClose={() => setTooltip(getClosedTooltipState)}
            onOpen={() => setTooltip(getOpenedTooltipState)}
            title={tooltipMessages.invalid}
          >
            <Error style={{ color: 'orange' }} />
          </Tooltip>
        );
      case 'valid':
        return (
          <Tooltip
            placement="top"
            open={tooltip.isOpen}
            onClose={() => setTooltip(getClosedTooltipState)}
            onOpen={() => setTooltip(getOpenedTooltipState)}
            title={tooltipMessages.valid}
          >
            <Check style={{ color: 'green' }} />
          </Tooltip>
        );
      case 'loading':
        return (
          <Tooltip
            placement="top"
            css={css`
              display: ${tooltip.isOpen
                ? 'block'
                : 'none'}; // To prevent flickering when tooltip is active and status changes
            `}
            open={tooltip.isOpen}
            onClose={() => setTooltip(getClosedTooltipState)}
            onOpen={() => setTooltip(getOpenedTooltipState)}
            title={tooltipMessages.loading}
          >
            <div style={{ display: 'flex' }}>
              <CircularProgress size={20} />
            </div>
          </Tooltip>
        );
    }
  }, [status, tooltipMessages, tooltip.isOpen]);

  return (
    <TextField
      ref={ref}
      {...TextFieldProps}
      InputProps={{
        ...TextFieldProps.InputProps,
        endAdornment: statusIcon,
      }}
    />
  );
});
