import { css } from '@emotion/react';
import { Launch, Work } from '@mui/icons-material';
import { Box, Link, Theme, Typography } from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridValidRowModel,
  useGridApiRef,
} from '@mui/x-data-grid';
import { fiFI } from '@mui/x-data-grid/locales';
import { useAtom } from 'jotai';
import { useEffect, useMemo, useRef, useState } from 'react';
import { start } from 'repl';

import { trpc } from '@frontend/client';
import { formatCurrency } from '@frontend/components/forms/CurrencyInput';
import { useTranslations } from '@frontend/stores/lang';
import { searchAtom } from '@frontend/stores/workTable';
import { useDebounce } from '@frontend/utils/useDebounce';

import { PlanningTableRow, ProjectObjectRow } from '@shared/schema/planningTable';

import { WorkTableFilters } from '../Filters/WorkTableFilters';

interface MaybeModifiedCellProps<T extends GridValidRowModel> {
  params: GridRenderCellParams<T>;
  children: React.ReactNode;
}

function MaybeModifiedCell({
  params,
  children,
}: Readonly<MaybeModifiedCellProps<PlanningTableRow>>) {
  const containerRef = useRef<HTMLDivElement>(null);

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

  & .MuiDataGrid-columnHeader {
    background: ${theme.palette.primary.main};
    color: white;
    height: 55px !important;
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
  & .cell-readonly {
    color: #7b7b7b;
    cursor: default;
  }
  & .MuiDataGrid-virtualScroller {
    min-height: 125px;
  }

  & .year-column {
    text-align: center;
  }
  & .financial-cell {
    text-align: right;
    font-family: monospace;
  }
  & .estimate-value {
    color: #1976d2;
    font-weight: 500;
  }
  & .actual-value {
    color: #2e7d32;
    font-weight: 600;
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

const pinnedColumns = [{ name: 'displayName', offset: 0 }];

export default function PlanningTable() {
  const [searchParams, setSearchParams] = useAtom(searchAtom);
  const [yearRange, setYearRange] = useState<{ start: number; end: number }>({
    start: new Date().getFullYear(),
    end: new Date().getFullYear() + 15,
  });
  const query = useDebounce(searchParams, 500);
  const tr = useTranslations();

  // Start with default year range (current year +/- 2 years)
  const currentYear = new Date().getFullYear();
  const defaultYearRange = {
    start: currentYear - 4,
    end: currentYear + 5,
  };
  console.log(searchParams);

  const planningData = trpc.planning.search.useQuery(
    {
      ...query,
      yearRange: yearRange,
    },
    //{
    //  yearRange: defaultYearRange,
    //}
  );

  const gridApiRef = useGridApiRef();

  const columns = useMemo(() => {
    return getColumns({
      yearRange: defaultYearRange,
      pinnedColumns: pinnedColumns.map((column) => column.name),
      planningData: planningData.data,
    });
  }, [defaultYearRange]);
  //const workTableData = trpc.workTable.search.useQuery(query);
  return (
    <Box
      css={css`
        height: 100%;
        display: flex;
        flex-direction: column;
      `}
    >
      <WorkTableFilters
        searchParams={searchParams}
        setSearchParams={setSearchParams}
        yearRange={{ startYear: defaultYearRange.start, endYear: defaultYearRange.end }}
        readOnly={false}
        expanded={true}
      />
      <DataGrid
        slots={{ noRowsOverlay: NoRowsOverlay }}
        getCellClassName={({ field }) => {
          const classNames = [];
          if (pinnedColumns.map((column) => column.name).includes(field)) {
            classNames.push(`pinned-${field}`);
          }
          if (field.startsWith('year')) {
            classNames.push('year-column');
          }
          return classNames.join(' ');
        }}
        disableVirtualization
        loading={planningData.isLoading}
        localeText={fiFI.components.MuiDataGrid.defaultProps.localeText}
        apiRef={gridApiRef}
        css={(theme) => dataGridStyle(theme, 15)}
        density={'standard'}
        columns={columns}
        rows={planningData.data ?? []}
        rowSelection={false}
        initialState={{ pagination: { paginationModel: { page: 0, pageSize: 1000 } } }}
        pageSizeOptions={[100, 500, 1000]}
        onCellKeyDown={(_params, event) => {
          if (!['Enter', 'NumpadEnter', 'Backspace', 'Delete'].includes(event.key)) {
            event.stopPropagation();
          }
        }}
        getRowId={(row) => row.id}
        disableColumnMenu
      />
    </Box>
  );
}

interface GetColumnsParams {
  yearRange: { start: number; end: number };
  pinnedColumns: string[];
  planningData?: PlanningTableRow[];
}

function getColumns({
  yearRange,
  pinnedColumns,
  planningData,
}: GetColumnsParams): GridColDef<PlanningTableRow>[] {
  const columns: GridColDef<PlanningTableRow>[] = [];

  // Name column (pinned)
  columns.push({
    field: 'displayName',
    headerName: 'Kohde/Hanke',
    flex: 1,
    minWidth: 300,
    headerClassName: 'pinned-displayName',
    renderCell: (params: GridRenderCellParams<PlanningTableRow>) => {
      const displayName =
        params.row.type === 'project' ? params.row.projectName : params.row.projectObjectName;

      return (
        <Box
          css={css`
            display: flex;
            align-items: center;
            gap: 4px;
          `}
        >
          <Link href="#" target="_blank" rel="noopener noreferrer">
            <Launch fontSize={'small'} htmlColor="#aaa" />
          </Link>
          <b
            title={displayName}
            css={css`
              max-height: 40px;
              display: -webkit-box;
              -webkit-box-orient: vertical;
              -webkit-line-clamp: 2;
              overflow: hidden;
              color: ${params.row.type === 'project' ? '#2e7d32' : '#1976d2'};
            `}
          >
            {displayName}
          </b>
        </Box>
      );
    },
    cellClassName: 'cell-wrap-text',
  });

  // Generate year columns dynamically
  for (let year = yearRange.start; year <= yearRange.end; year++) {
    const yearKey = `year${year}` as keyof PlanningTableRow;
    const currentYear = new Date().getFullYear();
    const isPastOrCurrent = year <= currentYear;

    columns.push({
      field: yearKey,
      headerName: `${year}`,
      width: isPastOrCurrent ? 170 : 90,
      headerAlign: 'center',
      headerClassName: 'year-column',
      renderHeader: () => (
        <Box
          css={css`
            display: flex;
            flex-direction: column;
            align-items: normal;
            width: 100%;
            gap: 2px;
          `}
        >
          <Box
            css={css`
              width: 100%;
              font-weight: 600;
              font-size: 14px;
            `}
          >
            {year}
          </Box>
          {isPastOrCurrent ? (
            <Box
              css={css`
                display: flex;
                width: 140px;
                justify-content: space-between;
                font-size: 10px;
                font-weight: 500;
                opacity: 0.9;
              `}
            >
              <Typography>Toteutunut</Typography>
              <Typography>Arvio</Typography>
            </Box>
          ) : (
            <Box
              css={css`
                font-size: 10px;
                font-weight: 500;
                opacity: 0.9;
              `}
            >
              Arvio
            </Box>
          )}
        </Box>
      ),
      renderCell: (params: GridRenderCellParams<PlanningTableRow>) => {
        const amount =
          params.row.type === 'projectObject'
            ? planningData
                ?.find((item) => item.id === params.row.id)
                ?.budget?.find((b) => b?.year === year)?.amount ?? null
            : null;

        const actual =
          params.row.type === 'projectObject' && params.row.id
            ? trpc.sap.getYearlyActualsByProjectObjectId.useQuery({
                projectObjectId: params.row.id,
                startYear: year,
                endYear: year,
              }).data?.[0].total ?? null
            : null;

        return (
          <Box
            css={css`
              display: flex;
              flex-direction: row;
              width: 100%;
              justify-content: space-between;
              align-items: center;
              font-family: monospace;
              font-size: 11px;
              line-height: 1.2;
              gap: 8px;
            `}
          >
            {isPastOrCurrent ? (
              <>
                <Box
                  className="actual-value"
                  css={css`
                    flex: 1;
                    text-align: left;
                  `}
                >
                  {formatCurrency(actual)}
                </Box>
                <Box
                  className="estimate-value"
                  css={css`
                    flex: 1;
                    text-align: right;
                  `}
                >
                  {formatCurrency(amount) ?? '-'}
                </Box>
              </>
            ) : (
              <Box
                className="estimate-value"
                css={css`
                  width: 100%;
                  text-align: right;
                `}
              >
                {formatCurrency(amount) ?? '-'}
              </Box>
            )}
          </Box>
        );
      },
      cellClassName: 'cell-wrap-text financial-cell',
    });
  }

  // Apply common properties to all columns
  return columns.map((column) => ({
    ...column,
    editable: false,
    filterable: false,
    sortable: false,
    resizable: false,
    renderCell: (params: GridRenderCellParams<PlanningTableRow>) => (
      <MaybeModifiedCell params={params}>{column.renderCell?.(params)}</MaybeModifiedCell>
    ),
  }));
}
