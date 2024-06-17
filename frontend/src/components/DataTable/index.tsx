import {
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableCellProps,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
  css,
} from '@mui/material';
import { ReactNode, useEffect, useMemo, useState } from 'react';

import { useTranslations } from '@frontend/stores/lang';

import { DataTableRow } from './DataTableRow';

interface Sort<TRow> {
  key: keyof TRow;
  direction: 'asc' | 'desc';
}

interface RowCount {
  rowCount: number;
}

export type ColumnSettings<TRow> = {
  [key in keyof TRow]: {
    title?: string;
    collapsible: boolean;
    format?: (value: TRow[key], row?: TRow) => ReactNode;
    width?: number;
    align?: TableCellProps['align'];
    type?: 'currency';
  };
};

interface DataQueryParams<TRow> {
  offset?: number;
  limit?: number;
  sort?: Sort<TRow>;
  filters?: object;
}

interface Props<
  TRow extends { actualEntries?: TActualEntry[] },
  TQueryParams extends DataQueryParams<TRow>,
  TActualEntry extends Partial<TRow>,
> {
  getRows: (params: TQueryParams) => Promise<readonly TRow[]>;
  getRowCount: (
    params: TQueryParams['filters'] extends object ? Pick<TQueryParams, 'filters'> : never,
  ) => Promise<RowCount>;
  onRowClick?: (row: TRow) => void;
  columns: ColumnSettings<Omit<TRow, 'actualEntries'>>;
  collapsedColumns?: ColumnSettings<TActualEntry>;
  filters: TQueryParams['filters'] extends object ? TQueryParams['filters'] : never;
  rowsPerPageOptions?: number[];
  defaultRowsPerPage?: number;
  disableSorting?: boolean;
}

export function DataTable<
  TRow extends { actualEntries?: TActualEntry[] },
  TQueryParams extends DataQueryParams<TRow>,
  TActualEntry extends Partial<TRow>,
>({
  getRows,
  getRowCount,
  onRowClick,
  columns,
  collapsedColumns,
  filters,
  rowsPerPageOptions = [10, 20, 30, 500],
  defaultRowsPerPage = rowsPerPageOptions[0],
  disableSorting = false,
}: Props<TRow, TQueryParams, TActualEntry>) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [visibleRows, setVisibleRows] = useState<readonly TRow[] | null>(null);
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [sort, setSort] = useState<Sort<TRow> | undefined>(undefined);

  const tr = useTranslations();

  const { offset, limit } = useMemo(
    () => ({ offset: page * rowsPerPage, limit: rowsPerPage }),
    [page, rowsPerPage],
  );

  const columnKeys = useMemo(() => {
    return Object.keys(columns) as (keyof typeof columns)[];
  }, [columns]);

  const currencyColumnKeys = columnKeys.filter((key) => columns[key]?.type === 'currency');

  useEffect(() => {
    let shouldUpdate = true;

    async function reloadSummary() {
      // TODO Some weird TS issues regarding optionality of the filters, though the Props typings are working correctly (which matters the most)...
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { rowCount } = await getRowCount({ filters } as any);
      if (shouldUpdate) {
        setRowCount(rowCount);
      }
    }

    reloadSummary();

    return () => {
      shouldUpdate = false;
    };
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    let shouldUpdate = true;

    async function reloadTableData() {
      setLoading(true);
      try {
        const rows = await getRows({ offset, limit, filters, sort } as unknown as TQueryParams);
        // On stacked requests, only update the UI when the latest request has been completed
        if (!shouldUpdate) {
          return;
        }
        setVisibleRows(rows);
        setLoading(false);
        setError(false);
      } catch (error) {
        setLoading(false);
        setError(true);
      }
    }

    reloadTableData();

    return () => {
      shouldUpdate = false;
    };
  }, [offset, limit, JSON.stringify(filters), sort]);

  const InfoTextCell = useMemo(
    () => (props: TableCellProps) => (
      <TableCell
        css={css`
          text-align: center;
          padding: 20px;
        `}
        colSpan={columnKeys.length}
        {...props}
      >
        <Typography variant="h6">{props.children}</Typography>
      </TableCell>
    ),
    [columnKeys],
  );

  return (
    <Paper
      css={css`
        flex-grow: 1;
        overflow: hidden;
      `}
    >
      <div
        css={css`
          position: relative;
          /* TODO relies on fixed height pagination, but couldn't make scrolling work properly with flex boxes... */
          height: calc(100% - 50px);
        `}
      >
        <TableContainer
          css={css`
            height: 100%;
          `}
        >
          <Table size="small">
            <TableHead
              css={(theme) => css`
                background: ${theme.palette.primary.main};
                position: sticky;
                top: 0;
                z-index: 1;
              `}
            >
              <TableRow>
                {columnKeys.map((key) => (
                  <TableCell
                    css={css`
                      min-width: ${columns[key].width}px;
                      color: #fff;
                    `}
                    key={key.toString()}
                    align={columns[key].align}
                  >
                    {key !== 'company' && !disableSorting ? (
                      <TableSortLabel
                        active={sort?.key === key}
                        direction={sort?.key === key ? sort.direction : 'asc'}
                        sx={{
                          '&.MuiTableSortLabel-root': {
                            color: '#fff',
                          },
                          '&.MuiTableSortLabel-root:hover': {
                            color: '#eee',
                          },
                          '&.Mui-active': {
                            fontWeight: 700,
                            color: '#eee',
                          },
                          '& .MuiTableSortLabel-icon': {
                            color: '#eee !important',
                          },
                        }}
                        onClick={() => {
                          setSort({
                            key,
                            direction:
                              sort?.key === key
                                ? sort?.direction === 'asc'
                                  ? 'desc'
                                  : 'asc'
                                : 'asc',
                          });
                        }}
                      >
                        {columns[key].title}
                      </TableSortLabel>
                    ) : (
                      columns[key].title
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {error ? (
                <TableRow>
                  <InfoTextCell>{tr('dataTable.error')}</InfoTextCell>
                </TableRow>
              ) : visibleRows == null ? (
                // Initial load
                new Array(rowsPerPage).fill(null).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={columnKeys.length}>&nbsp;</TableCell>
                  </TableRow>
                ))
              ) : !visibleRows.length ? (
                <TableRow>
                  <InfoTextCell>{tr('dataTable.noData')}</InfoTextCell>
                </TableRow>
              ) : (
                visibleRows.map((row, index) => (
                  <DataTableRow
                    onRowClick={onRowClick}
                    row={row}
                    collapsedColumns={collapsedColumns ?? null}
                    columnKeys={columnKeys}
                    columns={columns}
                    currencyColumnKeys={currencyColumnKeys}
                    key={index}
                  />
                ))
              )}
              <TableRow
                css={css`
                  position: absolute;
                  inset: 0;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  pointer-events: none;
                  background: rgba(0, 0, 0, 0.1);
                  opacity: ${loading ? 1 : 0};
                  transition: opacity 0.7s ease-in;
                `}
              >
                <TableCell>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </div>
      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        count={rowCount ?? 0}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, page) => setPage(page)}
        onRowsPerPageChange={(event) => setRowsPerPage(Number(event.target.value))}
      />
    </Paper>
  );
}
