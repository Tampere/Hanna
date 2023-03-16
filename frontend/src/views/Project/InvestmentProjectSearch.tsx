import { TextField } from '@mui/material';

import { Fieldset } from '@frontend/components/Fieldset';
import { useTranslations } from '@frontend/stores/lang';

export function InvestmentProjectSearch() {
  const tr = useTranslations();
  return (
    <Fieldset legend={tr('projectType.investmentProject')}>
      <TextField></TextField>
    </Fieldset>
  );
}
