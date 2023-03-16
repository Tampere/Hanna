import { Box, FormGroup, FormLabel, css } from '@mui/material';
import { useAtom } from 'jotai';

import { Fieldset } from '@frontend/components/Fieldset';
import { CodeSelect } from '@frontend/components/forms/CodeSelect';
import { useTranslations } from '@frontend/stores/lang';
import { investmentProjectFiltersAtom } from '@frontend/stores/search/project';

export function InvestmentProjectSearch() {
  const tr = useTranslations();
  const [searchParams, setSearchParams] = useAtom(investmentProjectFiltersAtom);

  return (
    <Fieldset legend={tr('projectType.investmentProject')}>
      <Box
        css={css`
          display: grid;
          grid-template-columns: repeat(3, 1fr);
        `}
      >
        <FormGroup>
          <FormLabel htmlFor="investment-project-committee">
            {tr('project.committeeLabel')}
          </FormLabel>
          <CodeSelect
            id="investment-project-committee"
            codeListId="Lautakunta"
            multiple
            value={searchParams.committees}
            onChange={(committees) => setSearchParams({ ...searchParams, committees })}
          />
        </FormGroup>
      </Box>
    </Fieldset>
  );
}
