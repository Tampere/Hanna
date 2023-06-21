import { Download, Search } from '@mui/icons-material';
import { FormControl, FormLabel, InputAdornment, Paper, TextField, css } from '@mui/material';
import { useAtom } from 'jotai';

import { trpc } from '@frontend/client';
import { AsyncJobButton } from '@frontend/components/AsyncJobButton';
import { CodeSelect } from '@frontend/components/forms/CodeSelect';
import { MultiSelect } from '@frontend/components/forms/MultiSelect';
import { useTranslations } from '@frontend/stores/lang';
import {
  plantsAtom,
  reasonsForEnvironmentalInvestmentAtom,
  textAtom,
  yearAtom,
} from '@frontend/stores/sapReport/environmentalCodeReportFilters';

export function EnvironmentalCodeReportFilters() {
  const tr = useTranslations();

  const [text, setText] = useAtom(textAtom);
  const [plants, setPlants] = useAtom(plantsAtom);
  const [reasonsForEnvironmentalInvestment, setReasonsForEnvironmentalInvestment] = useAtom(
    reasonsForEnvironmentalInvestmentAtom
  );
  const [year, setYear] = useAtom(yearAtom);

  const { data: allPlants, isLoading: allPlantsLoading } = trpc.sapReport.getPlants.useQuery();
  const { data: allYears, isLoading: allYearsLoading } = trpc.sapReport.getYears.useQuery();

  return (
    <Paper
      css={css`
        padding: 16px;
        display: flex;
        flex-direction: column;
      `}
    >
      <div
        css={css`
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        `}
      >
        <FormControl>
          <FormLabel htmlFor="text-search">{tr('projectSearch.textSearchLabel')}</FormLabel>
          <TextField
            id="text-search"
            size="small"
            placeholder={tr('projectSearch.textSearchTip')}
            value={text ?? ''}
            onChange={(event) => {
              setText(event.currentTarget.value);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="reasonsForEnvironmentalInvestments">
            {tr('sapReports.environmentCodes.reasonForEnvironmentalInvestment')}
          </FormLabel>
          <CodeSelect
            id="reasonsForEnvironmentalInvestments"
            codeListId="YmpäristönsuojelunSyy"
            multiple
            value={reasonsForEnvironmentalInvestment}
            onChange={setReasonsForEnvironmentalInvestment}
            maxTags={1}
            showIdInLabel
          />
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="plants">{tr('sapReports.environmentCodes.plant')}</FormLabel>
          <MultiSelect
            id="plants"
            options={allPlants ?? []}
            loading={allPlantsLoading}
            value={plants ?? []}
            onChange={setPlants}
            multiple
            maxTags={3}
          />
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="year">{tr('sapReports.environmentCodes.year')}</FormLabel>
          <MultiSelect
            id="year"
            options={allYears?.map(String) ?? []}
            loading={allYearsLoading}
            value={String(year ?? '')}
            onChange={(year) => setYear(year == null ? null : Number(year))}
            multiple={false}
          />
        </FormControl>
      </div>
      <AsyncJobButton
        css={css`
          align-self: flex-end;
        `}
        disabled
        variant="outlined"
        onStart={async () => {
          /**
           * TODO
           * - start report job with current filters
           * - return the job ID
           */
          return '';
        }}
        onFinished={(jobId) => {
          // TODO download report
        }}
        endIcon={<Download />}
      >
        {tr('sapReports.downloadReport')}
      </AsyncJobButton>
    </Paper>
  );
}
