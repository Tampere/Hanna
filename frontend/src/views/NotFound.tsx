import { Box, Typography } from '@mui/material';

import { useTranslations } from '@frontend/stores/lang';

export function NotFound() {
  const tr = useTranslations();
  return (
    <Box>
      <Typography variant="h4">{tr('notFound.title')}</Typography>
      <Typography variant="body1">{tr('notFound.text')}</Typography>
    </Box>
  );
}
