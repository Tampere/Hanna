import { Box, FormControlLabel, Switch } from '@mui/material';

import { useTranslations } from '@frontend/stores/lang';
import { HelpTooltip } from '@frontend/components/HelpTooltip';

interface Props {
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isChecked: boolean;
}

export function ProjectObjectParticipantFilter({ onChange, isChecked }: Props) {
  const tr = useTranslations();

  return (
    <FormControlLabel
      control={<Switch checked={isChecked} onChange={onChange} color="primary" />}
      label={
        <Box display="flex" alignItems={'center'} gap="sm">
          {tr('workTable.participantFilterLabel')}
          <HelpTooltip title={tr('workTable.participantFilterTooltip')} />
        </Box>
      }
      labelPlacement="end"
    />
  );
}
