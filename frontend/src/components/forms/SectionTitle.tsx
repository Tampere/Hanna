import { Typography } from '@mui/material';

interface Props {
  title: string;
}

export function SectionTitle({ title }: Props) {
  return (
    <Typography variant="overline" sx={{ color: '#777' }}>
      <strong>{title}</strong>
    </Typography>
  );
}
