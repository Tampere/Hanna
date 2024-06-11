import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { Box, Collapse, IconButton, TableCell, TableRow, css } from '@mui/material';
import { useState } from 'react';

import { useTranslations } from '@frontend/stores/lang';

import { ColumnSettings } from '.';

interface DataTableRowProps<
  TRow extends { actualEntries?: TActualEntry[] },
  TActualEntry extends Partial<TRow>,
> {
  columnKeys: Exclude<keyof TRow, 'actualEntries'>[];
  columns: ColumnSettings<Omit<TRow, 'actualEntries'>>;
  currencyColumnKeys: (keyof TRow)[];
  row: TRow;
  collapsedColumns: ColumnSettings<TActualEntry> | null;
  onRowClick?: (row: TRow) => void;
}

export function DataTableRow<
  TRow extends { actualEntries?: TActualEntry[] },
  TActualEntry extends Partial<TRow>,
>({
  columnKeys,
  columns,
  currencyColumnKeys,
  row,
  collapsedColumns,
  onRowClick,
}: DataTableRowProps<TRow, TActualEntry>) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const tr = useTranslations();
  function isValueCell(key: string) {
    return ['company', 'totalCredit', 'totalDebit', 'totalActuals'].includes(key);
  }

  return (
    <TableRow
      onClick={() => {
        if (onRowClick) {
          onRowClick(row);
        }
      }}
      css={css`
        cursor: ${onRowClick ? 'pointer' : 'auto'};
        &:hover {
          background: #eee;
        }
      `}
    >
      {columnKeys.map((key) => {
        const formattedTotalValue =
          columns[key].format?.(row[key], row) ?? row[key]?.toString() ?? '';

        if (collapsedColumns && 'actualEntries' in row && typeof row.actualEntries === 'object') {
          return (
            <TableCell
              className={String(key)}
              sx={{
                textWrap: currencyColumnKeys.includes(key) || key === 'company' ? 'nowrap' : 'wrap',
                verticalAlign: 'top',
              }}
              key={key.toString()}
              align={columns[key].align}
            >
              <Box
                css={css`
                  display: flex;
                  flex-direction: column;
                  align-items: ${columns[key].align === 'right' ? 'flex-end' : 'flex-start'};
                `}
              >
                {key === 'company' ? (
                  <span
                    css={css`
                      display: inline-flex;
                      height: 35px;
                      align-items: center;
                    `}
                  >
                    <span
                      css={(theme) => css`
                        color: ${theme.palette.primary.main};
                        font-size: 14px;
                        font-style: normal;
                        font-weight: ${isCollapsed ? 400 : 700};
                      `}
                    >
                      {tr('pieces', row.actualEntries.length)}
                    </span>
                    <IconButton size="small" onClick={() => setIsCollapsed((prev) => !prev)}>
                      {isCollapsed ? <KeyboardArrowDown /> : <KeyboardArrowUp />}
                    </IconButton>
                  </span>
                ) : (
                  <span
                    css={css`
                      display: inline-flex;
                      height: 35px;
                      align-items: center;
                      justify-content: flex-end;
                      font-weight: ${isValueCell(String(key)) && !isCollapsed ? 700 : 400};
                    `}
                  >
                    {formattedTotalValue}
                  </span>
                )}
                {isValueCell(String(key)) && (
                  <Collapse
                    style={{
                      transitionDuration: '0s',
                    }}
                    in={!isCollapsed}
                  >
                    <Box
                      css={css`
                        display: flex;
                        flex-direction: column;
                        gap: 0.5rem;
                        margin-top: 0.5rem;
                      `}
                    >
                      {row.actualEntries.map((entry, idx) => {
                        return (
                          <span
                            css={css`
                              font-weight: ${key === 'company' ? 500 : 400};
                              color: #525252;
                            `}
                            key={idx}
                          >
                            {collapsedColumns?.[key]?.format?.(entry[key]) ?? ''}
                          </span>
                        );
                      })}
                    </Box>
                  </Collapse>
                )}
              </Box>
            </TableCell>
          );
        }

        return (
          <TableCell
            className={String(key)}
            sx={{
              textWrap: currencyColumnKeys.includes(key) ? 'nowrap' : 'wrap',
            }}
            key={key.toString()}
            align={columns[key].align}
          >
            {formattedTotalValue}
          </TableCell>
        );
      })}
    </TableRow>
  );
}
