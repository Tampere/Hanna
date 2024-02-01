import { Search } from '@mui/icons-material';
import { InputAdornment, TextField, Theme, css } from '@mui/material';
import { LocalizationProvider, fiFI } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { SetStateAction, useAtomValue } from 'jotai';
import React from 'react';

import { CustomFormLabel } from '@frontend/components/forms';
import { CodeSelect } from '@frontend/components/forms/CodeSelect';
import { langAtom, useTranslations } from '@frontend/stores/lang';
import { FinancesRangeSelect } from '@frontend/views/WorkTable/Filters/FinancesRangeSelect';
import { YearMonthPicker } from '@frontend/views/WorkTable/Filters/YearMonthPicker';

import { WorkTableSearch } from '@shared/schema/workTable';

interface GridSpanProps {
  span: number;
  row: number;
  children: React.ReactNode;
  start?: number;
  wideScreenSpan?: number;
}

function GridSpan({
  start,
  span,
  row,
  children,
  wideScreenSpan,
}: GridSpanProps): React.ReactElement<GridSpanProps> {
  return (
    <div
      css={css`
        @media (min-width: 1500px) {
          grid-column: ${start ? `${start} / span ${span}` : `span ${wideScreenSpan ?? span}`};
        }
        grid-column: ${start ? `${start} / span ${span}` : `span ${span}`};
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
  yearRange: { startYear: number; endYear: number };
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
        .MuiFormLabel-root {
          font-size: 12px;
        }
        .MuiInputBase-input {
          font-size: 12px;
          //height: 1rem;
        }

        padding: ${theme.spacing(1)} 0;
        display: grid;
        grid-template-columns: repeat(14, 1fr);
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

      <LocalizationProvider
        dateAdapter={AdapterDayjs}
        adapterLocale={lang}
        localeText={{
          ...fiFI.components.MuiLocalizationProvider.defaultProps.localeText,
          // Add missing localizations for field placeholders
          fieldMonthPlaceholder: () => tr('date.monthPlaceholder'),
          fieldYearPlaceholder: () => tr('date.yearPlaceholder'),
        }}
      >
        <GridSpan row={1} span={2}>
          <CustomFormLabel label={tr('workTable.startDate')} htmlFor="startDateField" />
          <YearMonthPicker
            value={searchParams?.startDate ?? null}
            dateMode="startOfMonth"
            format="YYYY-MM-DD"
            DatePickerProps={{
              maxDate: searchParams.endDate ? dayjs(searchParams.endDate) : undefined,
            }}
            readOnly={props.readOnly}
            onChange={(value) => setSearchParams({ ...searchParams, startDate: value })}
          />
        </GridSpan>
        <GridSpan row={1} span={2}>
          <CustomFormLabel label={tr('workTable.endDate')} htmlFor="endDateField" />
          <YearMonthPicker
            value={searchParams?.endDate ?? null}
            dateMode="endOfMonth"
            format="YYYY-MM-DD"
            DatePickerProps={{
              minDate: searchParams.startDate ? dayjs(searchParams.startDate) : undefined,
            }}
            readOnly={props.readOnly}
            onChange={(value) => setSearchParams({ ...searchParams, endDate: value })}
          />
        </GridSpan>
      </LocalizationProvider>

      <GridSpan row={2} span={3} wideScreenSpan={2}>
        <CustomFormLabel label={tr('projectObject.objectTypeLabel')} htmlFor="objectTypeField" />
        <CodeSelect
          multiple
          readOnly={props.readOnly}
          maxTags={1}
          codeListId="KohdeTyyppi"
          value={searchParams.objectType}
          onChange={(type) => setSearchParams({ ...searchParams, objectType: type })}
        />
      </GridSpan>

      <GridSpan row={2} span={3} wideScreenSpan={2}>
        <CustomFormLabel
          label={tr('projectObject.objectCategoryLabelShort')}
          htmlFor="objectCategoryField"
        />
        <CodeSelect
          multiple
          readOnly={props.readOnly}
          maxTags={1}
          codeListId="KohteenOmaisuusLuokka"
          value={searchParams.objectCategory}
          onChange={(category) => setSearchParams({ ...searchParams, objectCategory: category })}
        />
      </GridSpan>

      <GridSpan row={2} span={3} wideScreenSpan={2}>
        <CustomFormLabel
          label={tr('projectObject.objectUsageLabelShort')}
          htmlFor="objectUsageField"
        />
        <CodeSelect
          multiple
          readOnly={props.readOnly}
          maxTags={1}
          codeListId="KohteenToiminnallinenKayttoTarkoitus"
          value={searchParams.objectUsage}
          onChange={(usage) => setSearchParams({ ...searchParams, objectUsage: usage })}
        />
      </GridSpan>

      <GridSpan row={2} span={3} wideScreenSpan={2}>
        <CustomFormLabel
          label={tr('projectObject.lifecycleStateLabel')}
          htmlFor="objectLifecycleState"
        />
        <CodeSelect
          multiple
          readOnly={props.readOnly}
          maxTags={1}
          codeListId="KohteenElinkaarentila"
          value={searchParams.lifecycleState}
          onChange={(state) => setSearchParams({ ...searchParams, lifecycleState: state })}
        />
      </GridSpan>

      <div
        css={(theme) => css`
          border-left: 1px solid #ccc;
          padding-left: ${theme.spacing(2)};
          grid-column: 13 / span 2;
          grid-row: 1 / span 2;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        `}
      >
        <CustomFormLabel label={tr('workTable.financesRangeLabel')} htmlFor="financesRangeField" />
        <FinancesRangeSelect
          readOnly={props.readOnly}
          value={searchParams.financesRange}
          yearRange={props.yearRange}
          onChange={(value) => setSearchParams({ ...searchParams, financesRange: value })}
          {...(searchParams.startDate &&
            searchParams.endDate && {
              yearRange: {
                startYear: dayjs(searchParams.startDate).year(),
                endYear: dayjs(searchParams.endDate).year(),
              },
            })}
        />
      </div>
    </div>
  );
}
