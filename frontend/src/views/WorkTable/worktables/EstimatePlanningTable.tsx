/*import { css } from '@emotion/react';
import { Launch } from '@mui/icons-material';
import { Box, Link, Theme, Typography } from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridRenderEditCellParams,
  GridValidRowModel,
  useGridApiRef,
} from '@mui/x-data-grid';
import { fiFI } from '@mui/x-data-grid/locales';
import { useEffect, useMemo, useRef, useState } from 'react';

import { trpc } from '@frontend/client';
import { useTranslations } from '@frontend/stores/lang';

import { PlanningTableRow } from '@shared/schema/planningTable';
import { ownsProject } from '@shared/schema/userPermissions';

import { financesField } from '../columns';
import { ModifiedFields } from '../diff';
import { CellEditEvent } from './WorkTable';

interface MaybeModifiedCellProps<T extends GridValidRowModel> {
  params: GridRenderCellParams<T>;
  children: React.ReactNode;
  modifiedFields?: ModifiedFields<T>;
}

function MaybeModifiedCell({
  params,
  children,
  modifiedFields,
}: Readonly<MaybeModifiedCellProps<PlanningTableRow>>) {
  const isModified = modifiedFields?.[params.id]?.[params.field as keyof PlanningTableRow];
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

const dataGridStyle = (theme: Theme, summaryRowHeight: number) => css`
  min-height: 160px;
  font-size: 12px;
  .odd {
    background-color: #fff;
  }
  .even {
    background-color: #f3f3f3;
  }
  & .MuiDataGrid-row:hover {
    background-color: #e7eef9;
  }
  @keyframes fadeInOut {
    0% {
      background-color: inherit;
    }
    50% {
      background-color: lightgreen;
    }
    100% {
      background-color: inherit;
    }
  }
  ${pinnedColumns.map(
    (column, idx) => `.pinned-${column.name} {
        background-color: inherit;
        position: sticky;
        left: ${column.offset}px;
        z-index: 101;
        border-right: ${
          idx === pinnedColumns.length - 1 ? '1px solid var(--DataGrid-rowBorderColor)' : 'none'
        };
  }`,
  )}
  & .MuiDataGrid-cell {
    display: flex;
    align-items: center;
    line-height: normal;
  }

  .highlight {
    animation-name: fadeInOut;
    animation-duration: 5000ms;
  }

  & .MuiDataGrid-columnHeader {
    background: ${theme.palette.primary.main};
    color: white;
    height: 45px !important;
    min-height: 0 !important;
    position: sticky;
    top: calc(${summaryRowHeight}px - 1rem);
    z-index: 100;
    ${pinnedColumns.map(
      (column) => `&.pinned-${column.name} {
        position: sticky;
        left: ${column.offset}px;
        z-index: 101;
      }`,
    )}
  }
  & .MuiDataGrid-columnHeaderTitle {
    line-height: normal;
    white-space: normal !important;
    word-wrap: break-word;
    font-weight: 600;
  }
  & .cell-wrap-text {
    white-space: normal !important;
    word-wrap: break-word;
  }
  & .modified-cell {
    background-color: lightyellow;
  }
  & .cell-readonly {
    color: #7b7b7b;
    cursor: default;
  }
  & .cell-writable {
    cursor: pointer;
  }
  & .MuiDataGrid-virtualScroller {
    min-height: 125px;
  }

  & .kayttosuunnitelmanMuutos-header {
    // TODO: figure out why column headerAlign doesn't work
    text-align: right;
  }
`;

function NoRowsOverlay() {
  const tr = useTranslations();
  return (
    <Box
      css={css`
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
      `}
    >
      <Typography variant="h6">{tr('workTable.noData')}</Typography>
    </Box>
  );
}
const pinnedColumns = [{ name: 'objectName', offset: 0 }];

export default function EstimatePlanningTable() {
  const tr = useTranslations();
  const planningData = trpc.planning.search.useQuery({});
  const gridApiRef = useGridApiRef();
  const summaryRowRef = useRef<HTMLElement>();

  const [editEvents, setEditEvents] = useState<CellEditEvent[]>([]);

  const modifiedFields = useMemo(() => {
    const fields: ModifiedFields<PlanningTableRow> = {};

    editEvents.forEach((editEvent) => {
      const { rowId, field } = editEvent;
      fields[rowId] = fields[rowId] ?? {};
      // fields[rowId][field] = true;
    });

    return fields;
  }, [editEvents]);

  const columns = useMemo(() => {
    return getColumns({
      modifiedFields,
      pinnedColumns: pinnedColumns.map((column) => column.name),
    });
  }, [modifiedFields]);

  console.log(planningData);
  return (
    <Box
      css={css`
        height: 100%;
        display: flex;
        flex-direction: column;
      `}
    >
      {planningData.isLoading ? 'loading' : JSON.stringify(planningData.data)}
      <DataGrid
        slots={{ noRowsOverlay: NoRowsOverlay }}
        //onResize={handleSummaryRowResize}
        /*isCellEditable={({ row, field }: { row: PlanningTableRow; field: string }) => {
          if (['amount', 'forecast', 'kayttosuunnitelmanMuutos'].includes(field)) {
            return getWritableBudgetFields(row.permissionCtx).includes(
              field as WorkTableFinanceField,
            );
          }
          return Boolean(
            auth &&
              (ownsProject(auth, row.permissionCtx) || hasWritePermission(auth, row.permissionCtx)),
          );
        }}  comment/
        getCellClassName={({ id, field, row }) => {
          const classNames = [];
          if (pinnedColumns.map((column) => column.name).includes(field)) {
            classNames.push(`pinned-${field}`);
          }
          /*if (id in modifiedFields && field in modifiedFields[id]) {
            classNames.push('modified-cell');
          } else if (
            auth &&
            (ownsProject(auth, row.permissionCtx) || hasWritePermission(auth, row.permissionCtx))
          ) {
            classNames.push('cell-writable');
          } else {
            classNames.push('cell-readonly');
          }    comment/
          return classNames.join(' ');
        }}
        disableVirtualization
        loading={planningData.isLoading}
        localeText={fiFI.components.MuiDataGrid.defaultProps.localeText}
        apiRef={gridApiRef}
        /*processRowUpdate={(newRow, oldRow) => {
          const cellEditEvent = getCellEditEvent(oldRow, newRow);
          if (cellEditEvent) {
            setEditEvents((prev) => [...prev, cellEditEvent]);
            setRedoEvents([]);
          }

          return newRow;
        }}    comment/
        css={(theme) => dataGridStyle(theme, 15 /* summaryRowHeight comment/)}
        density={'standard'}
        columns={columns}
        rows={planningData.data ?? []}
        rowSelection={false}
        initialState={{ pagination: { paginationModel: { page: 0, pageSize: 1000 } } }}
        pageSizeOptions={[100, 500, 1000]}
        onCellKeyDown={(_params, event) => {
          // restrict the keyboard behavior to only the keys we want to handle
          if (!['Enter', 'NumpadEnter', 'Backspace', 'Delete'].includes(event.key)) {
            event.stopPropagation();
          }
        }}
        onCellDoubleClick={async (params, event) => {
          if (!gridApiRef.current.isCellEditable(params)) {
            const element = document.elementFromPoint(
              event.clientX,
              event.clientY,
            ) as HTMLElement | null;
            if (!element) return;
            element.style.cursor = 'not-allowed';
            element.addEventListener('mouseleave', () => {
              element.style.cursor = '';
            });
          }
        }}
        getRowId={(row) => row.id}
        disableColumnMenu
      ></DataGrid>
    </Box>
  );
}

interface GetColumnsParams {
  yearRange: { start: number; end: number };
}

export function getColumns({
  yearRange,
}: GetColumnsParams): (GridColDef<PlanningTableRow> & { __isWrapped?: boolean })[] {
  const columns: (GridColDef<PlanningTableRow> & { __isWrapped?: boolean })[] = [
    fieldObjectName,

    financesField('amount', {
      headerName: 'Talousarvio',
      editable: true,
    }) as GridColDef<PlanningTableRow>,
    financesField('actual', {
      headerName: 'Toteuma',
      editable: false,
    }) as GridColDef<PlanningTableRow>,
  ];

  // Set common fields and wrap cell render to MaybeModifiedCell to avoid repetition
  return columns.map((column) => ({
    ...column,
    ...(pinnedColumns.map((c) => c.name).includes(column.field) && {
      headerClassName: `pinned-${column.field}`,
    }),
    editable: column.editable !== false,
    filterable: false,
    sortable: false,
    resizable: false,
    cellClassName: 'cell-wrap-text',
    renderCell: (params: GridRenderCellParams<PlanningTableRow>) => (
      <MaybeModifiedCell params={params} modifiedFields={modifiedFields}>
        {column.renderCell?.(params)}
      </MaybeModifiedCell>
    ),
  }));
}

const fieldObjectName = {
  field: 'objectName',
  headerName: 'Kohde',
  flex: 1,
  minWidth: 300,
  renderCell: (params: GridRenderCellParams<PlanningTableRow>) => (
    <Box
      css={css`
        display: flex;
        align-items: center;
        gap: 4px;
      `}
    >
      <Link href={`/investointihanke/`} target="_blank" rel="noopener noreferrer">
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
    return <Box>{params.value}</Box>;
  },
};
*/
