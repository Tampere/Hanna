import { Download, Search } from '@mui/icons-material';
import {
  Divider,
  FormControl,
  FormLabel,
  InputAdornment,
  Paper,
  TextField,
  css,
} from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';

import { trpc } from '@frontend/client';
import { AsyncJobButton } from '@frontend/components/AsyncJobButton';
import { CodeSelect } from '@frontend/components/forms/CodeSelect';
import { MultiSelect } from '@frontend/components/forms/MultiSelect';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import {
  environmentalCodeReportFilterAtom,
  reasonsForEnvironmentalInvestmentAtom,
  textAtom,
  useDebouncedEnvironmentalCodeReportFilters,
  yearsAtom,
} from '@frontend/stores/sapReport/environmentalCodeReportFilters';

import { ReportSummary } from './ReportSummary';

interface Props {
  disableExport?: boolean;
}

export function EnvironmentalCodeReportFilters({ disableExport }: Props) {
  const tr = useTranslations();
  const notify = useNotifications();

  const [text, setText] = useAtom(textAtom);
  const [reasonsForEnvironmentalInvestment, setReasonsForEnvironmentalInvestment] = useAtom(
    reasonsForEnvironmentalInvestmentAtom,
  );
  const [years, setYears] = useAtom(yearsAtom);
  const filters = useAtomValue(environmentalCodeReportFilterAtom);

  const { data: allYears, isLoading: allYearsLoading } = trpc.sapReport.getYears.useQuery();
  const { sapReport } = trpc.useUtils();

  const debouncedFilters = useDebouncedEnvironmentalCodeReportFilters();
  const { data: summary, isLoading: summaryLoading } =
    trpc.sapReport.getEnvironmentCodeReportSummary.useQuery({ filters: debouncedFilters });

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
          <FormLabel htmlFor="text-search">{tr('itemSearch.textSearchLabel')}</FormLabel>
          <TextField
            id="text-search"
            size="small"
            placeholder={tr('itemSearch.textSearchTip')}
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
            allowEmptySelection
          />
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="year">{tr('sapReports.environmentCodes.year')}</FormLabel>
          <MultiSelect
            id="years"
            options={allYears ?? []}
            loading={allYearsLoading}
            value={years}
            onChange={(years) => setYears(years.sort((a, b) => b - a))}
            multiple
          />
        </FormControl>
      </div>

      <AsyncJobButton
        css={css`
          align-self: flex-end;
        `}
        title={disableExport ? tr('sapReports.exportDisabled') : ''}
        variant="outlined"
        disabled={disableExport ?? false}
        onStart={async () => {
          return await sapReport.startEnvironmentCodeReportJob.fetch({ filters });
        }}
        onError={() => {
          notify({
            title: tr('sapReports.reportFailed'),
            severity: 'error',
          });
        }}
        onFinished={(jobId) => {
          // Create a link element to automatically download the new report
          const link = document.createElement('a');
          link.href = `/api/v1/report/file?id=${jobId}`;
          link.click();
        }}
        endIcon={<Download />}
      >
        {tr('sapReports.downloadReport')}
      </AsyncJobButton>
      <Divider
        css={css`
          margin-top: 24px;
          margin-bottom: 24px;
        `}
      />

      <ReportSummary loading={summaryLoading} summary={summary} />
    </Paper>
  );
}
