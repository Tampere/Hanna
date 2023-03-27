import { Box, FormGroup, FormLabel, css } from '@mui/material';
import { useAtom } from 'jotai';

import { Fieldset } from '@frontend/components/Fieldset';
import { CodeSelect } from '@frontend/components/forms/CodeSelect';
import { UserSelect } from '@frontend/components/forms/UserSelect';
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
          gap: 16px;
        `}
      >
        <FormGroup>
          <FormLabel htmlFor="detailplan-project-preparer">
            {tr('detailplanProject.preparerLabel')}
          </FormLabel>
          <UserSelect
            id="detailplan-project-preparer"
            multiple
            value={searchParams?.preparers ?? []}
            onChange={(preparers) => setSearchParams({ ...searchParams, preparers })}
          />
        </FormGroup>
        <FormGroup>
          <FormLabel htmlFor="detailplan-project-planning-zone">
            {tr('detailplanProject.planningZoneLabel')}
          </FormLabel>
          <CodeSelect
            id="detailplan-project-planning-zone"
            codeListId="AsemakaavaSuunnittelualue"
            multiple
            value={searchParams?.planningZones}
            onChange={(planningZones) => setSearchParams({ ...searchParams, planningZones })}
          />
        </FormGroup>
        <FormGroup>
          <FormLabel htmlFor="detailplan-project-subtypes">
            {tr('detailplanProject.subtypeLabel')}
          </FormLabel>
          <CodeSelect
            id="detailplan-project-subtypes"
            codeListId="AsemakaavaHanketyyppi"
            multiple
            value={searchParams?.subtypes}
            onChange={(subtypes) => setSearchParams({ ...searchParams, subtypes })}
          />
        </FormGroup>
      </Box>
    </Fieldset>
  );
}
