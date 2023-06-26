import { Download, Search } from '@mui/icons-material';
import { FormControl, FormLabel, InputAdornment, Paper, TextField, css } from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';

import { trpc } from '@frontend/client';
import { AsyncJobButton } from '@frontend/components/AsyncJobButton';
import { MultiSelect } from '@frontend/components/forms/MultiSelect';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import {
  blanketContractReportFilterAtom,
  blanketOrderIdAtom,
  consultCompaniesAtom,
  textAtom,
} from '@frontend/stores/sapReport/blanketContractReportFilters';

export function BlanketContractReportFilters() {
  const tr = useTranslations();
  const notify = useNotifications();

  const [text, setText] = useAtom(textAtom);
  const [consultCompanies, setConsultCompanies] = useAtom(consultCompaniesAtom);
  const [blanketOrderId, setBlanketOrderId] = useAtom(blanketOrderIdAtom);
  const filters = useAtomValue(blanketContractReportFilterAtom);

  const { data: allConsultCompanies, isLoading: allConsultCompaniesLoading } =
    trpc.sapReport.getConsultCompanies.useQuery();
  const { sapReport } = trpc.useContext();

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
          <TextField
            id="blanketOrderId"
            size="small"
            value={blanketOrderId ?? ''}
            onChange={(event) => {
              setBlanketOrderId(event.currentTarget.value);
            }}
          />
        </FormControl>
      </div>
      <AsyncJobButton
        css={css`
          align-self: flex-end;
        `}
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
    </Paper>
  );
}
