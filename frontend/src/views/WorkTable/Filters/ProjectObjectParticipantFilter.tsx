import { FormControlLabel, Switch } from '@mui/material';

import { useTranslations } from '@frontend/stores/lang';

interface Props {
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isChecked: boolean;
}

export function ProjectObjectParticipantFilter({ onChange, isChecked }: Props) {
  const tr = useTranslations();

  return (
    <FormControlLabel
      control={<Switch checked={isChecked} onChange={onChange} color="primary" />}
      label={tr('workTable.participantFilterLabel')}
      labelPlacement="end"
    />
  );
}
