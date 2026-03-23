import { Check, Error, Warning } from '@mui/icons-material';
import { CircularProgress, Tooltip } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import { type CodeId } from '@shared/schema/code';

import { CodeSelect } from './CodeSelect';

type Status = 'empty' | 'valid' | 'loading' | 'invalid' | 'error';

type Props = {
  id?: string;
  codeListId: CodeId['codeListId'];
  readOnly?: boolean;
  onBlur?: () => void;
  showIdInLabel?: boolean;
  allowEmptySelection?: boolean;
  disableClearable?: boolean;
  messages: Record<Exclude<Status, 'empty'>, string>;
  onStatusChange?: (status: Status) => void;
} & (
  | {
      multiple: true;
      value?: CodeId['id'][];
      onChange: (newValue: CodeId['id'][]) => void;
      maxTags?: number;
      validate: (value: string[]) => Promise<boolean>;
    }
  | {
      multiple?: false;
      value?: CodeId['id'];
      onChange: (newValue: CodeId['id'] | null) => void;
      maxTags?: never;
      validate: (value: string | null) => Promise<boolean>;
    }
);

export function CodeSelectWithStatus({
  validate,
  messages: tooltipMessages,
  onStatusChange,
  ...codeSelectProps
}: Props) {
  const [status, setStatus] = useState<Status>('empty');

  const value = codeSelectProps.multiple
    ? codeSelectProps.value ?? []
    : codeSelectProps.value ?? null;

  const valueKey = Array.isArray(value) ? value.join(',') : value ?? '';

  useEffect(() => {
    async function runValidate() {
      const isEmpty = Array.isArray(value) ? value.length === 0 : !value;
      if (isEmpty) {
        setStatus('empty');
        return;
      }
      setStatus('loading');
      try {
        const isValid = Array.isArray(value)
          ? await (validate as (v: string[]) => Promise<boolean>)(value)
          : await (validate as (v: string | null) => Promise<boolean>)(value);
        setStatus(isValid ? 'valid' : 'invalid');
      } catch {
        setStatus('error');
      }
    }
    runValidate();
  }, [valueKey]);

  useEffect(() => {
    onStatusChange?.(status);
  }, [status]);

  const statusIcon = useMemo(() => {
    switch (status) {
      case 'error':
        return (
          <Tooltip placement="top" title={tooltipMessages.error}>
            <Warning style={{ color: 'red' }} />
          </Tooltip>
        );
      case 'invalid':
        return (
          <Tooltip placement="top" title={tooltipMessages.invalid}>
            <Error style={{ color: 'orange' }} />
          </Tooltip>
        );
      case 'valid':
        return (
          <Tooltip placement="top" title={tooltipMessages.valid}>
            <Check style={{ color: 'green' }} />
          </Tooltip>
        );
      case 'loading':
        return (
          <Tooltip placement="top" title={tooltipMessages.loading}>
            <div style={{ display: 'flex' }}>
              <CircularProgress size={20} />
            </div>
          </Tooltip>
        );
      default:
        return undefined;
    }
  }, [status, tooltipMessages]);

  if (codeSelectProps.multiple) {
    return <CodeSelect {...codeSelectProps} endAdornment={statusIcon} />;
  }
  return <CodeSelect {...codeSelectProps} multiple={false} endAdornment={statusIcon} />;
}
