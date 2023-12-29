import { css } from '@emotion/react';
import { Launch } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import {
  GridColDef,
  GridRenderCellParams,
  GridRenderEditCellParams,
  GridValidRowModel,
} from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { useEffect, useRef } from 'react';
import React from 'react';
import { Link } from 'react-router-dom';

import {
  CurrencyInput,
  formatCurrency,
  valueTextColor,
} from '@frontend/components/forms/CurrencyInput';
import { useTranslations } from '@frontend/stores/lang';
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

type RenderCellType = (params: GridRenderCellParams, totalLabel?: string) => React.ReactNode;

interface MaybeModifiedCellProps<T extends GridValidRowModel> {
  params: GridRenderCellParams<T>;
  modifiedFields?: ModifiedFields<T>;
  column: GridColDef<WorkTableRow> & { __isWrapped?: boolean };
  renderCell: RenderCellType;
}

function MaybeModifiedCell({
  params,
  modifiedFields,
  column,
  renderCell,
}: Readonly<MaybeModifiedCellProps<WorkTableRow>>) {
  const isModified = modifiedFields?.[params.id]?.[params.field as keyof WorkTableRow];
  // WorkTable.tsx defines style with has selector for .modified-cell
  const containerRef = useRef<HTMLDivElement>(null);
  const tr = useTranslations();

  useEffect(() => {
    if (isModified) {
      containerRef.current?.parentElement?.classList.add('modified-cell');
    } else {
      containerRef.current?.parentElement?.classList.remove('modified-cell');
    }
  }, [isModified, containerRef]);

  if (params.row.id === 'sum-row') {
    if (
      ['operatives', 'budget', 'actual', 'forecast', 'kayttosuunnitelmanMuutos'].includes(
        column.field
      )
    ) {
      return (
        <div
          css={css`
            flex: 1;
          `}
          ref={containerRef}
        >
          {column.field === 'operatives'
            ? renderCell?.(params, tr('workTable.total'))
            : renderCell?.(params)}
        </div>
      );
    } else {
      return null;
    }
  }

  return (
    <div
      css={css`
        flex: 1;
      `}
      ref={containerRef}
    >
      {renderCell?.(params)}
    </div>
  );
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
  width: 256,
  editable: false,
  renderCell: (params: GridRenderCellParams) => (
    <Box
      css={(theme) => css`
        display: flex;
        align-items: center;
        gap: ${theme.spacing(1)};
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
  renderCell: ({ value, id }: GridRenderCellParams, totalLabel?: string) => {
    if (id === 'sum-row') {
      return (
        <div>
          <Typography
            css={css`
              font-size: 12px;
              font-weight: 700;
              text-align: right;
              color: black;
            `}
            variant="body2"
          >
            {totalLabel}
          </Typography>
        </div>
      );
    }
    return <ProjectObjectUsers value={value} />;
  },
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
  CurrencyInputProps?: {
    allowNegative?: boolean;
    valueTextColor?: (value: number | null) => string;
  }
) => {
  return {
    field: targetField,
    headerName: targetField,
    headerAlign: 'right',
    width: 128,
    editable: financesRange !== 'allYears',
    renderCell: ({ row, value }: GridRenderCellParams) => {
      if (row.id === 'sum-row') {
        return (
          <div
            css={css`
              flex: 1;
              text-align: right;
            `}
          >
            <Typography
              css={css`
                font-weight: 700;
                font-size: 12px;
                color: ${CurrencyInputProps?.valueTextColor?.(value) ?? 'black'};
              `}
              variant="body2"
            >
              {formatCurrency(value)}
            </Typography>
          </div>
        );
      }
      const startYear = dayjs(row.dateRange.startDate).year();
      const endYear = dayjs(row.dateRange.endDate).year();
      const notInRange =
        financesRange !== 'allYears' && (financesRange < startYear || financesRange > endYear);
      if (notInRange) {
        return (
          <div
            css={css`
              flex: 1;
              text-align: right;
            `}
          >
            —
          </div>
        );
      }
      return (
        <div
          css={css`
            flex: 1;
            color: ${CurrencyInputProps?.valueTextColor?.(value)};
            text-align: right;
          `}
        >
          {formatCurrency(value)}
        </div>
      );
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
          autoFocus
          editing
          getColor={CurrencyInputProps?.valueTextColor}
          value={value}
          allowNegative={CurrencyInputProps?.allowNegative ?? false}
          onChange={(val) => {
            api.setEditCellValue({ id, field, value: val });
          }}
          style={{
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
    financesField(
      financesRange,
      'forecast',
      { headerName: 'Ennuste' },
      { allowNegative: true, valueTextColor }
    ),
    financesField(
      financesRange,
      'kayttosuunnitelmanMuutos',
      {
        headerName: 'Käyttösuunnitelman muutos',
        minWidth: 188,
      },
      {
        valueTextColor,
      }
    ),
  ];

  // Set common fields and wrap cell render to MaybeModifiedCell to avoid repetition
  return columns.map((column) => ({
    ...column,
    editable: column.editable !== false,
    filterable: false,
    sortable: false,
    cellClassName: 'cell-wrap-text',
    renderCell: (params: GridRenderCellParams) => (
      <MaybeModifiedCell
        params={params}
        modifiedFields={modifiedFields}
        column={column}
        renderCell={column.renderCell as RenderCellType}
      />
    ),
  }));
}
