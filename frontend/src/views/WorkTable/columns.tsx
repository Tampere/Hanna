import { css } from '@emotion/react';
import { Launch } from '@mui/icons-material';
import { Box } from '@mui/material';
import {
  GridColDef,
  GridRenderCellParams,
  GridRenderEditCellParams,
  GridValidRowModel,
  gridPaginatedVisibleSortedGridRowIdsSelector,
  useGridApiContext,
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
import { CommitteeCodeSelect } from './CommitteeCodeSelect';
import { ProjectObjectNameEdit } from './ProjectObjectNameEdit';
import { ModifiedFields } from './diff';

interface GetColumnsParams {
  modifiedFields: ModifiedFields<WorkTableRow>;
  allYearsSelected: boolean;
  pinnedColumns: string[];
}

interface MaybeModifiedCellProps<T extends GridValidRowModel> {
  params: GridRenderCellParams<T>;
  children: React.ReactNode;
  modifiedFields?: ModifiedFields<T>;
}

export type WorkTableFinanceField = 'amount' | 'actual' | 'forecast' | 'kayttosuunnitelmanMuutos';

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
  flex: 1,
  minWidth: 300,
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
      <b
        title={params.value}
        css={css`
          max-height: 40px;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          overflow: hidden;
        `}
      >
        {params.value}
      </b>
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
  field: 'objectDateRange',
  headerName: 'Toteutusväli',
  flex: 1,
  minWidth: 95,
  renderCell: (params: GridRenderCellParams) => <DateRangeView value={params.value} />,
  renderEditCell: (params: GridRenderEditCellParams) => <DateRangeEdit {...params} />,
};

const fieldProjectLink = {
  field: 'projectLink',
  headerName: 'Hanke',
  flex: 1,
  minWidth: 256,
  editable: false,
  renderCell: (params: GridRenderCellParams) => {
    const allRowIds = params.api.getAllRowIds();
    const currentRowIndex = allRowIds.indexOf(params.row.id);
    const apiRef = useGridApiContext();

    const currentRowRelativeIndex = gridPaginatedVisibleSortedGridRowIdsSelector(apiRef).indexOf(
      params.row.id,
    );
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
                max-width: 220px;
                max-height: 40px;
                display: -webkit-box;
                padding-right: 8px;
                text-align: right;
                -webkit-box-orient: vertical;
                -webkit-line-clamp: 2;
                overflow: hidden;
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
  flex: 1,
  minWidth: 160,
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
  flex: 1,
  minWidth: 160,
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
  flex: 1,
  minWidth: 172,
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

const fieldObjectCommittee = {
  field: 'committee',
  headerName: 'Lautakunta',
  flex: 1,
  minWidth: 172,
  renderCell: (params: GridRenderCellParams) => (
    <CodeSpan codeListId={workTableColumnCodes['committee']} value={params.value} />
  ),
  renderEditCell: (params: GridRenderEditCellParams) => {
    const { id, field, value, row } = params;

    return (
      <CommitteeCodeSelect
        projectId={row.projectLink.projectId}
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

const fieldOperatives = {
  field: 'operatives',
  headerName: 'Rakennuttaja / Suunnitteluttaja',
  flex: 1,
  minWidth: 144,
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
  targetField: 'amount' | 'actual' | 'forecast' | 'kayttosuunnitelmanMuutos',
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
    headerClassName: `${targetField}-header`, // for some reason kayttoSuunnitelmanMuutos-header is not aligning right so let's use this
    flex: 1,
    minWidth: 128,
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
  pinnedColumns,
}: GetColumnsParams): (GridColDef<WorkTableRow> & { __isWrapped?: boolean })[] {
  const columns: (GridColDef<WorkTableRow> & { __isWrapped?: boolean })[] = [
    fieldProjectLink,
    fieldObjectName,
    fieldObjectLifecycleState,
    fieldDateRange,
    fieldObjectType,
    fieldObjectCategory,
    fieldObjectUsage,
    fieldObjectCommittee,
    fieldOperatives,
    financesField('amount', { headerName: 'Talousarvio', editable: !allYearsSelected }),
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
        flex: 1,
        minWidth: 172,
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
    ...(pinnedColumns.includes(column.field) && { headerClassName: `pinned-${column.field}` }),
    editable: column.editable !== false,
    filterable: false,
    sortable: false,
    resizable: false,
    cellClassName: 'cell-wrap-text',
    renderCell: (params: GridRenderCellParams) => (
      <MaybeModifiedCell params={params} modifiedFields={modifiedFields}>
        {column.renderCell?.(params)}
      </MaybeModifiedCell>
    ),
  }));
}
