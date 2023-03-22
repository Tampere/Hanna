import { Box, FormGroup, FormLabel, css } from '@mui/material';
import { useAtom } from 'jotai';

import { Fieldset } from '@frontend/components/Fieldset';
import { CodeSelect } from '@frontend/components/forms/CodeSelect';
import { useTranslations } from '@frontend/stores/lang';
import { detailplanProjectFiltersAtom } from '@frontend/stores/search/project';

export function DetailplanProjectSearch() {
  const tr = useTranslations();
  const [searchParams, setSearchParams] = useAtom(detailplanProjectFiltersAtom);

  return (
    <Fieldset legend={tr('projectType.detailplanProject')}>
      <Box
        css={css`
          display: grid;
          grid-template-columns: repeat(3, 1fr);
        `}
      >
        <FormGroup>
          <FormLabel htmlFor="detailplan-project-committee">
            {tr('detailplanProject.planningZoneLabel')}
          </FormLabel>
          <CodeSelect
            id="detailplan-project-committee"
            codeListId="AsemakaavaSuunnittelualue"
            multiple
            value={searchParams?.planningZones}
            onChange={(planningZones) => setSearchParams({ ...searchParams, planningZones })}
          />
        </FormGroup>
      </Box>
    </Fieldset>
  );
}
