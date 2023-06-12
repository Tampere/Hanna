import { Download } from '@mui/icons-material';
import { Paper, css } from '@mui/material';

import { AsyncJobButton } from '@frontend/components/AsyncJobButton';
import { useTranslations } from '@frontend/stores/lang';

export function EnvironmentalCodeReportFilters() {
  const tr = useTranslations();
  return (
    <Paper
      css={css`
        padding: 16px;
      `}
    >
      {/* TODO filters */}
      <AsyncJobButton
        variant="outlined"
        onStart={async () => {
          /**
           * TODO
           * - start report job with current filters
           * - return the job ID
           */
          return 'foo';
        }}
        onFinished={(jobId) => {
          // TODO download report
        }}
        endIcon={<Download />}
      >
        {tr('sapReports.downloadReport')}
      </AsyncJobButton>
    </Paper>
  );
}
