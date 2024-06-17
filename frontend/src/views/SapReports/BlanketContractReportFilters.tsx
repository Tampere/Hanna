import { Download, Search } from '@mui/icons-material';
import {
  Box,
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
import { HelpTooltip } from '@frontend/components/HelpTooltip';
import { MultiSelect } from '@frontend/components/forms/MultiSelect';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import {
  blanketContractReportFilterAtom,
  blanketOrderIdsAtom,
  consultCompaniesAtom,
  textAtom,
  useDebouncedBlanketContractReportFilters,
  yearsAtom,
} from '@frontend/stores/sapReport/blanketContractReportFilters';

import { ReportSummary } from './ReportSummary';

interface Props {
  disableExport?: boolean;
}

export function BlanketContractReportFilters({ disableExport }: Props) {
  const tr = useTranslations();
  const notify = useNotifications();

  const [text, setText] = useAtom(textAtom);
  const [consultCompanies, setConsultCompanies] = useAtom(consultCompaniesAtom);
  const [blanketOrderIds, setBlanketOrderIds] = useAtom(blanketOrderIdsAtom);

  const [years, setYears] = useAtom(yearsAtom);
  const filters = useAtomValue(blanketContractReportFilterAtom);

  const { data: allConsultCompanies, isLoading: allConsultCompaniesLoading } =
    trpc.sapReport.getConsultCompanies.useQuery();
  const { sapReport } = trpc.useUtils();

  const debouncedFilters = useDebouncedBlanketContractReportFilters();
  const { data: summary, isLoading: summaryLoading } =
    trpc.sapReport.getBlanketContractReportSummary.useQuery({ filters: debouncedFilters });

  const { data: allYears, isLoading: allYearsLoading } = trpc.sapReport.getYears.useQuery();

  const { data: blanketContractIdOptions, isLoading: blanketContractIdOptionsLoading } =
    trpc.sapReport.getBlanketOrderIds.useQuery({}, { staleTime: 60 * 60 * 1000 });

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
          align-items: end;
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
          <FormLabel htmlFor="consultCompanies">
            {tr('sapReports.blanketContracts.consultCompany')}
          </FormLabel>
          <MultiSelect
            id="consultCompanies"
            options={allConsultCompanies ?? []}
            loading={allConsultCompaniesLoading}
            value={consultCompanies ?? []}
            onChange={(value) => setConsultCompanies(value)}
            multiple
            maxTags={3}
          />
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="blanketOrderId">
            {tr('sapReports.blanketContracts.blanketOrderId')}
          </FormLabel>
          <MultiSelect
            multiple
            id="blanketOrderId"
            loading={blanketContractIdOptionsLoading}
            options={blanketContractIdOptions ?? []}
            getOptionId={(option) => option}
            getOptionLabel={(option) => {
              return option.startsWith('TRE:') ? option : `TRE:${option}`;
            }}
            value={blanketOrderIds ?? []}
            onChange={(newValue) => {
              setBlanketOrderIds(newValue);
            }}
          />
        </FormControl>
        <FormControl
          css={css`
            align-self: bottom;
          `}
        >
          <Box display="flex">
            <FormLabel htmlFor="year">{tr('sapReports.blanketContracts.year')}</FormLabel>
            <HelpTooltip title={tr('sapReports.blanketContracts.yearHelp')} />
          </Box>

          <MultiSelect
            id="years"
            options={allYears ?? []}
            loading={allYearsLoading}
            value={years[0]}
            onChange={(year) => setYears(year ? [year] : [])}
            multiple={false}
          />
        </FormControl>
      </div>
      <AsyncJobButton
        css={css`
          align-self: flex-end;
        `}
        disabled={disableExport ?? false}
        title={disableExport ? tr('sapReports.exportDisabled') : ''}
        variant="outlined"
        onStart={async () => {
          return await sapReport.startBlanketContractReportJob.fetch({ filters });
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
