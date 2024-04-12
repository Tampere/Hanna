import { css } from '@emotion/react';
import { Launch } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import {
  GridColDef,
  GridRenderCellParams,
  GridRenderEditCellParams,
  GridValidRowModel,
  gridPaginatedVisibleSortedGridRowIdsSelector,
} from '@mui/x-data-grid';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import {
  CurrencyInput,
  formatCurrency,
  valueTextColor,
} from '@frontend/components/forms/CurrencyInput';
import { TableCodeCheckbox } from '@frontend/views/WorkTable/CodeCheckbox';
import { TableCodeSelect } from '@frontend/views/WorkTable/CodeSelect';
import { CodeSpanMulti } from '@frontend/views/WorkTable/CodeSpanMulti';
import { DateRangeEdit, DateRangeView } from '@frontend/views/WorkTable/DateRangePicker';
import {
  ProjectObjectUserEdit,
  ProjectObjectUsers,
} from '@frontend/views/WorkTable/ProjectObjectUsers';

import { WorkTableRow, workTableColumnCodes } from '@shared/schema/workTable';

import { CodeSpan } from './CodeSpan';
import { ProjectObjectNameEdit } from './ProjectObjectNameEdit';
import { ModifiedFields } from './diff';

interface GetColumnsParams {
  modifiedFields: ModifiedFields<WorkTableRow>;
  allYearsSelected: boolean;
}

interface MaybeModifiedCellProps<T extends GridValidRowModel> {
  params: GridRenderCellParams<T>;
  children: React.ReactNode;
  modifiedFields?: ModifiedFields<T>;
}

export type WorkTableFinanceField = 'budget' | 'actual' | 'forecast' | 'kayttosuunnitelmanMuutos';

function MaybeModifiedCell({
  params,
  children,
  modifiedFields,
}: Readonly<MaybeModifiedCellProps<WorkTableRow>>) {
  const isModified = modifiedFields?.[params.id]?.[params.field as keyof WorkTableRow];
  // WorkTable.tsx defines style with has selector for .modified-cell
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isModified) {
      containerRef.current?.parentElement?.classList.add('modified-cell');
    } else {
      containerRef.current?.parentElement?.classList.remove('modified-cell');
    }
  }, [isModified, containerRef]);
  return (
    <div
      css={css`
        flex: 1;
      `}
      ref={containerRef}
    >
      {children}
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
    <CodeSpan codeListId={workTableColumnCodes['lifecycleState']} value={params.value} />
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
  renderCell: (params: GridRenderCellParams) => {
    const allRowIds = params.api.getAllRowIds();
    const currentRowIndex = allRowIds.indexOf(params.row.id);

    const currentRowRelativeIndex = gridPaginatedVisibleSortedGridRowIdsSelector(
      params.api.state,
    ).indexOf(params.row.id);
    let displayProjectLink: boolean;

    if (currentRowRelativeIndex > 0) {
      const previousRow = params.api.getRow(allRowIds[currentRowIndex - 1]);

      displayProjectLink =
        params.row.projectLink.projectName !== previousRow.projectLink.projectName;
    } else {
      displayProjectLink = true;
    }

    return (
      <Box
        css={(theme) => css`
          display: flex;
          align-items: center;
          gap: ${theme.spacing(1)};
          justify-content: flex-end;
        `}
      >
        {displayProjectLink ? (
          <>
            <Link
              to={`/investointihanke/${params.value.projectId}`}
              target="_blank"
              rel="noopener noreferrer"
              css={css`
                cursor: pointer;
              `}
            >
              <Launch fontSize={'small'} htmlColor="#aaa" />
            </Link>
            <b
              title={params.value.projectName}
              css={css`
                color: green;
                text-align: right;
                max-width: 220px;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
              `}
            >
              {params.value.projectName}
            </b>
          </>
        ) : (
          '└'
        )}
      </Box>
    );
  },
};

const fieldObjectType = {
  field: 'objectType',
  headerName: 'Tyyppi',
  width: 160,
  renderCell: (params: GridRenderCellParams) => (
    <CodeSpanMulti codeListId={workTableColumnCodes['objectType']} value={params.value} />
  ),
  renderEditCell(params: GridRenderEditCellParams) {
    const { id, field, value } = params;
    return (
      <TableCodeCheckbox
        codeListId={workTableColumnCodes['objectType']}
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
    <CodeSpanMulti codeListId={workTableColumnCodes['objectCategory']} value={params.value} />
  ),
  renderEditCell(params: GridRenderEditCellParams) {
    const { id, field, value } = params;
    return (
      <TableCodeCheckbox
        codeListId={workTableColumnCodes['objectCategory']}
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
    <CodeSpanMulti codeListId={workTableColumnCodes['objectUsage']} value={params.value} />
  ),
  renderEditCell(params: GridRenderEditCellParams) {
    const { id, field, value } = params;
    return (
      <TableCodeCheckbox
        codeListId={workTableColumnCodes['objectUsage']}
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
  targetField: 'budget' | 'actual' | 'forecast' | 'kayttosuunnitelmanMuutos',
  opts?: Partial<GridColDef<WorkTableRow>>,
  CurrencyInputProps?: {
    allowNegative?: boolean;
    valueTextColor?: (value: number | null) => string;
  },
): GridColDef<WorkTableRow> & { __isWrapped?: boolean } => {
  return {
    field: targetField,
    headerName: targetField,
    headerAlign: 'right',
    width: 128,
    renderCell: ({ value }: GridRenderCellParams) => {
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
  allYearsSelected,
}: GetColumnsParams): (GridColDef<WorkTableRow> & { __isWrapped?: boolean })[] {
  const columns: (GridColDef<WorkTableRow> & { __isWrapped?: boolean })[] = [
    fieldProjectLink,
    fieldObjectName,
    fieldObjectLifecycleState,
    fieldDateRange,
    fieldObjectType,
    fieldObjectCategory,
    fieldObjectUsage,
    fieldOperatives,
    financesField('budget', { headerName: 'Talousarvio', editable: !allYearsSelected }),
    financesField('actual', { headerName: 'Toteuma', editable: false }),
    financesField(
      'forecast',
      { headerName: 'Ennuste', editable: !allYearsSelected },
      { allowNegative: true, valueTextColor },
    ),
    financesField(
      'kayttosuunnitelmanMuutos',
      {
        headerName: 'Käyttösuunnitelman muutos',
        minWidth: 188,
        editable: !allYearsSelected,
      },
      {
        valueTextColor,
      },
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
      <MaybeModifiedCell params={params} modifiedFields={modifiedFields}>
        {column.renderCell?.(params)}
      </MaybeModifiedCell>
    ),
  }));
}
