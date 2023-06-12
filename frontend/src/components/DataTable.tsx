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
import { useEffect, useMemo, useState } from 'react';

import { useTranslations } from '@frontend/stores/lang';

interface Sort<TRow extends object> {
  key: keyof TRow;
  direction: 'asc' | 'desc';
}

type ColumnSettings<TRow extends object> = {
  [key in keyof TRow]: {
    title: string;
    format?: (value: TRow[key]) => string;
    width?: number;
    align?: TableCellProps['align'];
  };
};

interface DataQueryParams<TRow extends object> {
  offset: number;
  limit: number;
  sort?: Sort<TRow>;
  filters?: object;
}

interface Props<TRow extends object, TQueryParams extends DataQueryParams<TRow>> {
  getRows: (params: TQueryParams) => Promise<readonly TRow[]>;
  getRowCount: (
    params: TQueryParams['filters'] extends object ? Pick<TQueryParams, 'filters'> : never
  ) => Promise<number>;
  columns: ColumnSettings<TRow>;
  filters?: TQueryParams['filters'] extends object ? TQueryParams['filters'] : never;
  rowsPerPageOptions?: number[];
  defaultRowsPerPage?: number;
}

export function DataTable<TRow extends object, TQueryParams extends DataQueryParams<TRow>>({
  getRows,
  getRowCount,
  columns,
  filters,
  rowsPerPageOptions = [10, 20, 30, 500],
  defaultRowsPerPage = 10,
}: Props<TRow, TQueryParams>) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [visibleRows, setVisibleRows] = useState<readonly TRow[] | null>(null);
  const [totalRowCount, setTotalRowCount] = useState<number>(0);
  const [sort, setSort] = useState<Sort<TRow> | undefined>(undefined);

  const tr = useTranslations();

  const { offset, limit } = useMemo(
    () => ({ offset: page * rowsPerPage, limit: rowsPerPage }),
    [page, rowsPerPage]
  );

  const columnKeys = useMemo(() => {
    return Object.keys(columns) as (keyof typeof columns)[];
  }, [columns]);

  useEffect(() => {
    // TODO Some weird TS issues regarding optionality of the filters, though the Props typings are working correctly (which matters the most)...
    getRowCount({ filters } as any).then(setTotalRowCount);
  }, [filters]);

  useEffect(() => {
    async function reloadTableData() {
      const offset = page * rowsPerPage;
      const limit = rowsPerPage;
      setLoading(true);
      try {
        const rows = await getRows({ offset, limit, filters, sort } as TQueryParams);
        setVisibleRows(rows);
        setLoading(false);
        setError(false);
      } catch (error) {
        setLoading(false);
        setError(true);
      }
    }

    reloadTableData();
  }, [offset, limit, filters, sort]);

  const InfoTextCell = useMemo(
    () => (props: TableCellProps) =>
      (
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
    [columnKeys]
  );

  return (
    <Paper>
      <TableContainer>
        <Table size="small">
          <TableHead
            css={(theme) => css`
              background: ${theme.palette.primary.main};
            `}
          >
            <TableRow>
              {columnKeys.map((key) => (
                <TableCell
                  key={key.toString()}
                  width={columns[key].width}
                  align={columns[key].align}
                >
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
                          sort?.key === key ? (sort?.direction === 'asc' ? 'desc' : 'asc') : 'asc',
                      });
                    }}
                  >
                    {columns[key].title}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody
            css={css`
              position: relative;
            `}
          >
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
                <TableRow key={index}>
                  {columnKeys.map((key) => {
                    const formattedValue =
                      columns[key].format?.(row[key]) ?? row[key]?.toString() ?? '';
                    return (
                      <TableCell key={key.toString()} align={columns[key].align}>
                        {formattedValue}
                      </TableCell>
                    );
                  })}
                </TableRow>
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
                transition: opacity 0.1s ease-in;
              `}
            >
              <TableCell>
                <CircularProgress />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        count={totalRowCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, page) => setPage(page)}
        onRowsPerPageChange={(event) => setRowsPerPage(Number(event.target.value))}
      />
    </Paper>
  );
}
