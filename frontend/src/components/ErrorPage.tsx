import { ArrowBack } from '@mui/icons-material';
import { Alert, AlertColor, AlertTitle, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router';

import { useTranslations } from '@frontend/stores/lang';

interface Props {
  severity: AlertColor & ('error' | 'warning');
  message: string;
  title?: string;
}

export function ErrorPage({ severity, message, title }: Props) {
  const tr = useTranslations();
  const navigate = useNavigate();

  return (
    <Box>
      <Alert severity={severity}>
        <AlertTitle>{title ?? tr(`errorPage.${severity}`)}</AlertTitle>
        {message}
      </Alert>
      <Button
        endIcon={<ArrowBack />}
        variant="contained"
        sx={{ mt: 2 }}
        onClick={() => navigate(-1)}
      >
        {tr('errorPage.navigateBack')}
      </Button>
    </Box>
  );
}
