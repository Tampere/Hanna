import { ButtonProps } from '@mui/material';
import { useEffect, useState } from 'react';

import { trpc } from '@frontend/client';

import { LoadingButton } from './LoadingButton';

interface Props extends ButtonProps {
  onStart: () => Promise<string>;
  onFinished?: (jobId: string) => void | Promise<void>;
  onError?: () => void | Promise<void>;
  pollingIntervalMs?: number;
  timeoutMs?: number;
}

export function AsyncJobButton(props: Props) {
  const { onStart, onFinished, onError, pollingIntervalMs, timeoutMs, ...buttonProps } = props;
  const { job } = trpc.useContext();

  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      return;
    }

    setLoading(true);

    const timeout =
      timeoutMs != null
        ? setTimeout(() => {
            onError?.();
            setLoading(false);
          }, timeoutMs)
        : null;

    const interval = setInterval(async () => {
      // Get the job status from the server
      const { isFinished, state } = await job.getStatus.fetch({ jobId });

      // Handle error & finished states
      if (state === 'completed') {
        onFinished?.(jobId);
      } else if (isFinished) {
        onError?.();
      } else {
        // Not finished or errors - continue polling
        return;
      }

      if (timeout != null) {
        clearTimeout(timeout);
      }
      clearInterval(interval);
      setLoading(false);
    }, pollingIntervalMs ?? 1000);

    return () => {
      clearInterval(interval);
    };
  }, [jobId]);

  return (
    <LoadingButton
      {...buttonProps}
      loading={loading}
      disabled={loading || props.disabled}
      onClick={async () => {
        setJobId(await onStart());
      }}
    >
      {buttonProps.children}
    </LoadingButton>
  );
}
