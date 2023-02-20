import { CircularProgress, IconButton, Tooltip } from '@mui/material';
import { ReactNode, useEffect, useState } from 'react';

interface Props {
  icon: ReactNode;
  onStart: () => Promise<string>;
  isFinished: (jobId: string) => Promise<boolean>;
  onFinished: (jobId: string) => Promise<void>;
  pollingIntervalTimeout?: number;
  tooltip?: ReactNode;
}

export function AsyncJobIconButton(props: Props) {
  const { icon, onStart, isFinished, onFinished, pollingIntervalTimeout, tooltip } = props;

  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      return;
    }

    setLoading(true);

    const interval = setInterval(async () => {
      if (!(await isFinished(jobId))) {
        // Status is not yet ready, keep on polling
        return;
      }

      // Job is done - clear the interval and invoke the callback
      clearInterval(interval);
      onFinished(jobId);
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
      <Tooltip title={tooltip ?? ''}>
        <IconButton
          disabled={loading}
          onClick={async () => {
            setJobId(await onStart());
          }}
        >
          {icon}
        </IconButton>
      </Tooltip>
    </div>
  );
}
