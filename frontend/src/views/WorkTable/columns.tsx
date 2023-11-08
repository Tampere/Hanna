import { css } from '@emotion/react';
import { Launch } from '@mui/icons-material';
import { Box } from '@mui/material';
import {
  GridColDef,
  GridRenderCellParams,
  GridRenderEditCellParams,
  GridValidRowModel,
} from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

import { CurrencyInput, formatCurrency } from '@frontend/components/forms/CurrencyInput';
import { TableCodeCheckbox } from '@frontend/views/WorkTable/CodeCheckbox';
import { TableCodeSelect } from '@frontend/views/WorkTable/CodeSelect';
import { CodeSpanMulti } from '@frontend/views/WorkTable/CodeSpanMulti';
import { DateRangeEdit, DateRangeView } from '@frontend/views/WorkTable/DateRangePicker';
import {
  ProjectObjectUserEdit,
  ProjectObjectUsers,
} from '@frontend/views/WorkTable/ProjectObjectUsers';

import { FinancesRange, WorkTableRow } from '@shared/schema/workTable';

import { CodeSpan } from './CodeSpan';
import { ProjectObjectNameEdit } from './ProjectObjectNameEdit';
import { ModifiedFields } from './diff';

interface GetColumnsParams {
  modifiedFields: ModifiedFields<WorkTableRow>;
  financesRange: FinancesRange;
}

function isFinanceEditingDisabled(row: WorkTableRow, financesRange: FinancesRange) {
  if (financesRange === 'allYears') {
    return true;
  }

  const startYear = dayjs(row.dateRange.startDate).year();
  const endYear = dayjs(row.dateRange.endDate).year();

  return financesRange < startYear || financesRange > endYear;
}
interface MaybeModifiedCellProps<T extends GridValidRowModel> {
  params: GridRenderCellParams<T>;
  children: React.ReactNode;
  modifiedFields?: ModifiedFields<T>;
}

function MaybeModifiedCell({
  params,
  children,
  modifiedFields,
}: Readonly<MaybeModifiedCellProps<WorkTableRow>>) {
  const isModified = modifiedFields?.[params.id]?.[params.field as keyof WorkTableRow];
  // WorkTable.tsx defines style with has selector for .modified-cell
  return <div className={isModified ? 'modified-cell' : 'unmodified-cell'}>{children}</div>;
}

const fieldObjectName = {
  field: 'objectName',
  headerName: 'Kohde',
  width: 220,
  renderCell: (params: GridRenderCellParams<WorkTableRow>) => (
    <Box
      css={css`
        display: flex;
        align-items: center;
        gap: 4px;
      `}
    >
      <Link
        to={`/investointihanke/${params.row.projectLink.projectId}/kohde/${params.row.id}`}
        target="_blank"
      >
        <Launch fontSize={'small'} htmlColor="#aaa" />
      </Link>
      <b>{params.value}</b>
    </Box>
  ),
  renderEditCell: (params: GridRenderEditCellParams) => {
    return (
      <ProjectObjectNameEdit
        value={params.value}
        onChange={(newValue) => {
          params.api.setEditCellValue({
            id: params.id,
            field: params.field,
            value: newValue,
          });

          params.api.stopCellEditMode({
            id: params.id,
            field: params.field,
          });
        }}
      />
    );
  },
};

const fieldObjectLifecycleState = {
  field: 'lifecycleState',
  headerName: 'Tila',
  renderCell: (params: GridRenderCellParams) => (
    <CodeSpan codeListId={'KohteenElinkaarentila'} value={params.value} />
  ),
  renderEditCell: (params: GridRenderEditCellParams) => {
    const { id, field, value } = params;
    return (
      <TableCodeSelect
        codeListId="KohteenElinkaarentila"
        value={value}
        onChange={(newValue) => {
          params.api.setEditCellValue({ id, field, value: newValue });
          params.api.stopCellEditMode({ id, field, cellToFocusAfter: 'right' });
        }}
        onCancel={() => params.api.stopCellEditMode({ id, field })}
      />
    );
  },
};

const fieldDateRange = {
  field: 'dateRange',
  headerName: 'Toteutusväli',
  width: 90,
  renderCell: (params: GridRenderCellParams) => <DateRangeView value={params.value} />,
  renderEditCell: (params: GridRenderEditCellParams) => <DateRangeEdit {...params} />,
};

const fieldProjectLink = {
  field: 'projectLink',
  headerName: 'Hanke',
  width: 188,
  editable: false,
  renderCell: (params: GridRenderCellParams) => (
    <Box
      css={(theme) => css`
        display: flex;
        align-items: center;
        gap: ${theme.spacing(1)};
        justify-content: space-between;
      `}
    >
      <Launch fontSize={'small'} htmlColor="#aaa" />
      <Link
        to={`/investointihanke/${params.value.projectId}`}
        target="_blank"
        rel="noopener noreferrer"
        css={css`
          cursor: pointer;
          color: inherit;
          text-decoration-line: underline;
          text-decoration-thickness: 2px;
          text-decoration-style: dotted;
          text-decoration-color: #999;
          text-underline-offset: 3px;
          margin-right: 2px;
        `}
      >
        {params.value.projectName}
      </Link>
    </Box>
  ),
};

const fieldObjectType = {
  field: 'objectType',
  headerName: 'Tyyppi',
  width: 160,
  renderCell: (params: GridRenderCellParams) => (
    <CodeSpanMulti codeListId={'KohdeTyyppi'} value={params.value} />
  ),
  renderEditCell(params: GridRenderEditCellParams) {
    const { id, field, value } = params;
    return (
      <TableCodeCheckbox
        codeListId={'KohdeTyyppi'}
        value={value}
        onChange={(newValue) => {
          params.api.setEditCellValue({ id, field, value: newValue });
          params.api.stopCellEditMode({ id, field });
        }}
        onCancel={() => params.api.stopCellEditMode({ id, field })}
      />
    );
  },
};

const fieldObjectCategory = {
  field: 'objectCategory',
  headerName: 'Omaisuusluokka',
  width: 160,
  renderCell: (params: GridRenderCellParams) => (
    <CodeSpanMulti codeListId={'KohteenOmaisuusLuokka'} value={params.value} />
  ),
  renderEditCell(params: GridRenderEditCellParams) {
    const { id, field, value } = params;
    return (
      <TableCodeCheckbox
        codeListId={'KohteenOmaisuusLuokka'}
        value={value}
        onChange={(newValue) => {
          params.api.setEditCellValue({ id, field, value: newValue });
          params.api.stopCellEditMode({ id, field });
        }}
        onCancel={() => params.api.stopCellEditMode({ id, field })}
      />
    );
  },
};

const fieldObjectUsage = {
  field: 'objectUsage',
  headerName: 'Käyttötarkoitus',
  width: 172,
  renderCell: (params: GridRenderCellParams) => (
    <CodeSpanMulti codeListId={'KohteenToiminnallinenKayttoTarkoitus'} value={params.value} />
  ),
  renderEditCell(params: GridRenderEditCellParams) {
    const { id, field, value } = params;
    return (
      <TableCodeCheckbox
        codeListId={'KohteenToiminnallinenKayttoTarkoitus'}
        value={value}
        onChange={(newValue) => {
          params.api.setEditCellValue({ id, field, value: newValue });
          params.api.stopCellEditMode({ id, field });
        }}
        onCancel={() => params.api.stopCellEditMode({ id, field })}
      />
    );
  },
};

const fieldOperatives = {
  field: 'operatives',
  headerName: 'Rakennuttaja / Suunnitteluttaja',
  width: 144,
  renderCell: ({ value }: GridRenderCellParams) => <ProjectObjectUsers value={value} />,
  renderEditCell: (params: GridRenderEditCellParams) => {
    const { id, field, value } = params;
    return (
      <ProjectObjectUserEdit
        value={value}
        onChange={(newValue) => params.api.setEditCellValue({ id, field, value: newValue })}
      />
    );
  },
};

const financesField = (
  financesRange: FinancesRange,
  targetField: 'budget' | 'actual' | 'forecast' | 'kayttosuunnitelmanMuutos',
  opts?: Partial<GridColDef<WorkTableRow>>,
  CurrencyInputProps?: { allowNegative: boolean }
) => {
  return {
    field: targetField,
    headerName: targetField,
    editable: financesRange !== 'allYears',
    cellClassName: 'cell-align-right',
    renderCell: ({ row, value }: GridRenderCellParams) => {
      const startYear = dayjs(row.dateRange.startDate).year();
      const endYear = dayjs(row.dateRange.endDate).year();
      const notInRange =
        financesRange !== 'allYears' && (financesRange < startYear || financesRange > endYear);
      if (notInRange) {
        return <span>—</span>;
      }
      return <span>{formatCurrency(value)}</span>;
    },
    renderEditCell: (params: GridRenderEditCellParams) => {
      const { id, field, value, api } = params;
      // NOTE: this is a workaround for not being able to disable editing for a single cell
      // based on the business logic.
      const isDisabled = isFinanceEditingDisabled(params.row, financesRange);
      if (isDisabled) {
        api.stopCellEditMode({ id: params.id, field: params.field });
        return <span></span>;
      }

      return (
        <CurrencyInput
          editing
          value={value}
          allowNegative={CurrencyInputProps?.allowNegative ?? false}
          onChange={(val) => {
            api.setEditCellValue({ id, field, value: val });
          }}
          className="absolute-cell"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            outline: 'none',
          }}
        />
      );
    },
    ...opts,
  };
};

export function getColumns({
  modifiedFields,
  financesRange,
}: GetColumnsParams): (GridColDef<WorkTableRow> & { __isWrapped?: boolean })[] {
  const columns: (GridColDef<WorkTableRow> & { __isWrapped?: boolean })[] = [
    fieldObjectName,
    fieldObjectLifecycleState,
    fieldDateRange,
    fieldProjectLink,
    fieldObjectType,
    fieldObjectCategory,
    fieldObjectUsage,
    fieldOperatives,
    financesField(financesRange, 'budget', { headerName: 'Talousarvio' }),
    financesField(financesRange, 'actual', { headerName: 'Toteuma', editable: false }),
    financesField(financesRange, 'forecast', { headerName: 'Ennuste' }, { allowNegative: true }),
    financesField(financesRange, 'kayttosuunnitelmanMuutos', {
      headerName: 'KSM',
      flex: 1,
      minWidth: 100,
    }),
  ];

  // Set common fields and wrap cell render to MaybeModifiedCell to avoid repetition
  return columns.map((column) => ({
    ...column,
    editable: column.editable !== false,
    filterable: false,
    sortable: false,
    cellClassName: 'cell-wrap-text',
    renderCell: (params: GridRenderCellParams) => (
      <MaybeModifiedCell params={params} modifiedFields={modifiedFields}>
        {column.renderCell?.(params)}
      </MaybeModifiedCell>
    ),
  }));
}
