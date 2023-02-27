import { Button, CircularProgress } from '@mui/material';
import { ReactNode, useEffect, useState } from 'react';

interface Props<ErrorType> {
  label: string;
  icon: ReactNode;
  onStart: () => Promise<string>;
  getStatus: (jobId: string) => Promise<{
    finished: boolean;
    error?: ErrorType;
  }>;
  onFinished: (jobId: string) => Promise<void>;
  onError: (error: ErrorType) => void;
  pollingIntervalTimeout?: number;
  disabled?: boolean;
}

export function AsyncJobButton<ErrorType>(props: Props<ErrorType>) {
  const { label, icon, onStart, getStatus, onFinished, onError, pollingIntervalTimeout } = props;

  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      return;
    }

    setLoading(true);

    const interval = setInterval(async () => {
      const status = await getStatus(jobId);
      if (status.error) {
        onError(status.error);
      } else if (status.finished) {
        onFinished(jobId);
      } else {
        return;
      }

      clearInterval(interval);
      setLoading(false);
    }, pollingIntervalTimeout ?? 1000);

    return () => {
      clearInterval(interval);
    };
  }, [jobId]);

  return (
    // Lay the loading indicator on top of the disabled icon to avoid UI jumps
    <div style={{ position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {loading && <CircularProgress size={20} />}
      </div>
      <Button
        disabled={loading || props.disabled}
        onClick={async () => {
          setJobId(await onStart());
        }}
        endIcon={icon}
      >
        {label}
      </Button>
    </div>
  );
}