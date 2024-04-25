import { FormControlLabel, Switch } from '@mui/material';

import { useTranslations } from '@frontend/stores/lang';

interface Props {
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProjectObjectParticipantFilter({ onChange }: Props) {
  const tr = useTranslations();
  return (
    <FormControlLabel
      value="start"
      control={<Switch onChange={onChange} color="primary" />}
      label={tr('workTable.participantFilterLabel')}
      labelPlacement="start"
    />
  );
}
