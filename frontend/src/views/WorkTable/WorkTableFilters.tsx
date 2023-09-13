import { Search } from '@mui/icons-material';
import { InputAdornment, TextField, Theme, css } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { SetStateAction, useAtomValue } from 'jotai';
import { WorkTableSearch } from 'tre-hanna-shared/src/schema/workTable';

import { CustomFormLabel } from '@frontend/components/forms';
import { CodeSelect } from '@frontend/components/forms/CodeSelect';
import { DatePicker } from '@frontend/components/forms/DatePicker';
import { langAtom, useTranslations } from '@frontend/stores/lang';

interface GridSpanProps {
  span: number;
  row: number;
  children: React.ReactNode;
}
function GridSpan({ span, row, children }: GridSpanProps): React.ReactElement<GridSpanProps> {
  return (
    <div
      css={css`
        grid-column: span ${span};
        grid-row: ${row};
      `}
    >
      {children}
    </div>
  );
}

interface Props {
  searchParams: WorkTableSearch;
  setSearchParams: (value: SetStateAction<WorkTableSearch>) => void;
  readOnly?: boolean;
}

export function WorkTableFilters(props: Props) {
  const { searchParams, setSearchParams } = props;
  const tr = useTranslations();
  const lang = useAtomValue(langAtom);

  const textFieldProps = {
    fullWidth: true,
    size: 'small',
    type: 'text',
    disabled: props.readOnly,
    variant: props.readOnly ? 'filled' : 'outlined',
    hiddenLabel: props.readOnly,
  } as const;

  const searchInputProps = {
    startAdornment: (
      <InputAdornment position="start">
        <Search />
      </InputAdornment>
    ),
  };

  return (
    <div
      css={(theme: Theme) => css`
        padding: ${theme.spacing(2)} 0;
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        grid-template-rows: 1fr 1fr;
        gap: ${theme.spacing(2)};
      `}
    >
      <GridSpan row={1} span={4}>
        <CustomFormLabel
          label={tr('projectObject.nameLabelFull')}
          htmlFor="projectObjectNameField"
        />
        <TextField
          {...textFieldProps}
          id="projectObjectNameField"
          placeholder={tr('search.searchTerm', 3)}
          value={searchParams.projectObjectName}
          onChange={(e) => setSearchParams({ ...searchParams, projectObjectName: e.target.value })}
          InputProps={{ ...searchInputProps }}
        />
      </GridSpan>

      <GridSpan row={1} span={4}>
        <CustomFormLabel label={tr('project.projectNameLabel')} htmlFor="projectNameField" />
        <TextField
          {...textFieldProps}
          id="projectNameField"
          placeholder={tr('search.searchTerm', 3)}
          value={searchParams.projectName}
          onChange={(e) => setSearchParams({ ...searchParams, projectName: e.target.value })}
          InputProps={{ ...searchInputProps }}
        />
      </GridSpan>

      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={lang}>
        <GridSpan row={1} span={2}>
          <CustomFormLabel label={tr('workTable.startDate')} htmlFor="startDateField" />
          <DatePicker
            readOnly={props.readOnly}
            value={searchParams.startDate ?? null}
            onChange={(startDate) => {
              if (startDate !== 'Invalid Date') {
                setSearchParams({ ...searchParams, startDate: startDate ?? null });
              }
            }}
          />
        </GridSpan>
        <GridSpan row={1} span={2}>
          <CustomFormLabel label={tr('workTable.endDate')} htmlFor="endDateField" />
          <DatePicker
            readOnly={props.readOnly}
            value={searchParams.endDate ?? null}
            onChange={(endDate) => {
              if (endDate !== 'Invalid Date') {
                setSearchParams({ ...searchParams, endDate: endDate });
              }
            }}
          />
        </GridSpan>
      </LocalizationProvider>

      <GridSpan row={2} span={2}>
        <CustomFormLabel label={tr('projectObject.objectTypeLabel')} htmlFor="objectTypeField" />
        <CodeSelect
          multiple
          readOnly={props.readOnly}
          maxTags={1}
          codeListId="KohdeTyyppi"
          value={searchParams.projectObjectType}
          onChange={(type) => setSearchParams({ ...searchParams, projectObjectType: type })}
        />
      </GridSpan>

      <GridSpan row={2} span={2}>
        <CustomFormLabel
          label={tr('projectObject.objectCategoryLabel')}
          htmlFor="objectCategoryField"
        />
        <CodeSelect
          multiple
          readOnly={props.readOnly}
          maxTags={1}
          codeListId="KohteenOmaisuusLuokka"
          value={searchParams.projectObjectCategory}
          onChange={(category) =>
            setSearchParams({ ...searchParams, projectObjectCategory: category })
          }
        />
      </GridSpan>

      <GridSpan row={2} span={2}>
        <CustomFormLabel
          label={tr('projectObject.objectUsageLabelShort')}
          htmlFor="objectUsageField"
        />
        <CodeSelect
          multiple
          readOnly={props.readOnly}
          maxTags={1}
          codeListId="KohteenToiminnallinenKayttoTarkoitus"
          value={searchParams.projectObjectUsage}
          onChange={(usage) => setSearchParams({ ...searchParams, projectObjectUsage: usage })}
        />
      </GridSpan>

      <GridSpan row={2} span={2}>
        <CustomFormLabel
          label={tr('projectObject.lifecycleStateLabel')}
          htmlFor="objectLifecycleState"
        />
        <CodeSelect
          multiple
          readOnly={props.readOnly}
          maxTags={1}
          codeListId="KohteenElinkaarentila"
          value={searchParams.projectObjectLifecycleState}
          onChange={(state) =>
            setSearchParams({ ...searchParams, projectObjectLifecycleState: state })
          }
        />
      </GridSpan>
    </div>
  );
}
