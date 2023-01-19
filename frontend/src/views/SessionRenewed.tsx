import { Box, Typography } from '@mui/material';
import { useEffect } from 'react';

import { useTranslations } from '@frontend/stores/lang';

export function SessionRenewed() {
  const tr = useTranslations();

  // On mount, if the page was opened via session expired warning, close the page and notify the opener
  useEffect(() => {
    if (!window.opener) {
      return;
    }
    window.opener?.postMessage('session-renewed');
    window.close();
  }, []);

  return (
    <Box>
      <Typography variant="h4">{tr('sessionRenewed.title')}</Typography>
      <Typography variant="body1">{tr('sessionRenewed.text')}</Typography>
    </Box>
  );
}
