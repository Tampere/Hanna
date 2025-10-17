import { css } from '@emotion/react';
import { Cancel, Redo, Save, Undo } from '@mui/icons-material';
import { Box, Button, IconButton, Link, Theme, Tooltip, Typography } from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridRenderEditCellParams,
  useGridApiRef,
} from '@mui/x-data-grid';
import { fiFI } from '@mui/x-data-grid/locales';
import { useQueries } from '@tanstack/react-query';
import { useAtom, useAtomValue } from 'jotai';
import { atomWithDefault } from 'jotai/utils';
import { type SetStateAction, useEffect, useMemo, useRef, useState } from 'react';

import { trpc } from '@frontend/client';
import { CurrencyInput, formatCurrency } from '@frontend/components/forms/CurrencyInput';
import dayjs from '@frontend/dayjs';
import { asyncUserAtom } from '@frontend/stores/auth';
import { useTranslations } from '@frontend/stores/lang';
import { searchAtom } from '@frontend/stores/workTable';
import { useDebounce } from '@frontend/utils/useDebounce';

import { isoDateFormat } from '@shared/date';
import { PlanningTableRow } from '@shared/schema/planningTable';
import { hasPermission, isAdmin } from '@shared/schema/userPermissions';
import type { WorkTableSearch } from '@shared/schema/workTable';

import { ProjectObjectParticipantFilter } from '../Filters/ProjectObjectParticipantFilter';
import { WorkTableFilters } from '../Filters/WorkTableFilters';
import { YearPicker } from '../Filters/YearPicker';

type PlanningRowWithYears = PlanningTableRow & Record<string, number | null>;

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

  /* Ensure pinned name column has opaque background matching row striping */
  & .odd .pinned-displayName {
    background-color: #fff !important;
  }
  & .even .pinned-displayName {
    background-color: #f3f3f3 !important;
  }

  ${pinnedColumns.map(
    (column, idx) => `.MuiDataGrid-cell.pinned-${column.name} {
        background-color: #fff;
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

  & .modified-cell {
    background-color: lightyellow;
  }
  & .cell-readonly {
    color: #7b7b7b;
    cursor: default;
    background-color: #efefef;
  }
  & .cell-readonly .estimate-value,
  & .cell-readonly .actual-value {
    color: #7b7b7b !important;
  }
  & .cell-writable {
    cursor: pointer;
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

function NoRowsOverlay({ label }: { label: string }) {
  return (
    <Box
      css={css`
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
      `}
    >
      <Typography variant="h6">{label}</Typography>
    </Box>
  );
}

const pinnedColumns = [{ name: 'displayName', offset: 0 }];

export default function PlanningTable() {
  const auth = useAtomValue(asyncUserAtom);
  const lockedYears = trpc.lockedYears.get.useQuery().data ?? [];

  // Custom search atom for PlanningTable with extended year range
  const currentYear = new Date().getFullYear();
  const planningSearchAtom = useMemo(
    () =>
      atomWithDefault((get) => {
        const baseSearch = get(searchAtom);
        return {
          ...baseSearch,
          objectStartDate: dayjs([currentYear, 0, 1]).format(isoDateFormat),
          objectEndDate: dayjs([currentYear + 15, 11, 31]).format(isoDateFormat),
        };
      }),
    [currentYear],
  );

  const [searchParams, setSearchParams] = useAtom(planningSearchAtom);
  const query = useDebounce(searchParams, 500);
  const tr = useTranslations();

  // Start with default year range (current year to current year + 15)
  const defaultYearRange = {
    start: currentYear,
    end: currentYear + 15,
  };

  const planningData = trpc.planning.search.useQuery(query);

  function participantFilterChange() {
    if (searchParams.objectParticipantUser) {
      setSearchParams((prev) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { objectParticipantUser, ...rest } = prev;
        return rest;
      });
    } else {
      setSearchParams((prev) => ({
        ...prev,
        objectParticipantUser: auth?.id,
      }));
    }
  }

  type EditEvent = {
    rowId: string;
    field: string; // yearYYYY
    year: number;
    oldValue: number | null;
    newValue: number | null;
  };

  const [editEvents, setEditEvents] = useState<EditEvent[]>([]);
  const [redoEvents, setRedoEvents] = useState<EditEvent[]>([]);

  const gridApiRef = useGridApiRef();

  const yearRange = useMemo(
    () =>
      searchParams.objectStartDate && searchParams.objectEndDate
        ? {
            start: dayjs(searchParams.objectStartDate).year(),
            end: dayjs(searchParams.objectEndDate).year(),
          }
        : defaultYearRange,
    [
      searchParams.objectStartDate,
      searchParams.objectEndDate,
      defaultYearRange.start,
      defaultYearRange.end,
    ],
  );

  const originalRows = useMemo(() => {
    if (!planningData.data) return [] as PlanningRowWithYears[];
    return planningData.data.map((row) => {
      const r: PlanningRowWithYears = { ...(row as any) };
      for (let y = yearRange.start; y <= yearRange.end; y++) {
        const budgetAmount =
          row.type === 'projectObject'
            ? row.budget?.find((b) => b?.year === y)?.amount ?? null
            : null;
        (r as any)[`year${y}`] = budgetAmount;
      }
      return r;
    });
  }, [planningData.data, yearRange.start, yearRange.end]);

  const [rows, setRows] = useState<PlanningRowWithYears[]>(originalRows);

  useEffect(() => {
    setRows(originalRows);
    setEditEvents([]);
    setRedoEvents([]);
  }, [originalRows]);

  const modifiedFields = useMemo(() => {
    const map: Record<string, Record<string, boolean>> = {};
    editEvents.forEach((e) => {
      map[e.rowId] = map[e.rowId] ?? {};
      map[e.rowId][e.field] = true;
    });
    return map;
  }, [editEvents]);

  function isYearField(field: string): boolean {
    return /^year\d{4}$/.test(field);
  }

  function canEditYear(field: string, row: PlanningRowWithYears): boolean {
    if (!isYearField(field)) return false;
    if (row.type !== 'projectObject') return false;
    if (!auth) return false;
    const year = Number(field.replace('year', ''));
    const yearIsLocked = lockedYears?.includes(year);
    if (yearIsLocked) return false;
    const startYear = dayjs((row as any).objectDateRange?.startDate).year();
    const endYear = dayjs((row as any).objectDateRange?.endDate).year();
    const inRange = year >= startYear && year <= endYear;
    if (!inRange) return false;
    return isAdmin(auth.role) || hasPermission(auth, 'investmentFinancials.write');
  }

  const poIds = useMemo(
    () =>
      Array.from(
        new Set(rows.filter((r) => (r as any).type === 'projectObject').map((r) => (r as any).id)),
      ),
    [rows],
  );

  const utils = trpc.useUtils();
  const actualsQueries = useQueries({
    queries: poIds.map((id) => ({
      queryKey: ['sapActuals', id, yearRange.start, yearRange.end],
      queryFn: () =>
        utils.sap.getYearlyActualsByProjectObjectId.fetch({
          projectObjectId: id as string,
          startYear: yearRange.start,
          endYear: yearRange.end,
        }),
      enabled: Boolean(id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const actualsByPo = useMemo(() => {
    const map = new Map<string, Record<number, number>>();
    actualsQueries.forEach((q, idx) => {
      const id = poIds[idx] as string;
      const data = (q.data ?? []) as { year: number; total: number }[];
      const rec: Record<number, number> = {};
      data.forEach((d) => {
        rec[d.year] = d.total;
      });
      map.set(id, rec);
    });
    return map;
  }, [actualsQueries, poIds]);

  const columns = useMemo(() => {
    return getColumns({
      yearRange,
      pinnedColumns: pinnedColumns.map((column) => column.name),
      planningData: rows,
      canEditYear,
      modifiedFields,
      actualsByPo,
      tr: tr as (key: string, ...args: any[]) => string,
    });
  }, [rows, yearRange.start, yearRange.end, lockedYears, auth, actualsByPo, tr]);

  function undo() {
    const last = editEvents[editEvents.length - 1];
    if (!last) return;
    setEditEvents((prev) => prev.slice(0, -1));
    setRedoEvents((prev) => [...prev, last]);
    gridApiRef.current.updateRows([{ id: last.rowId, [last.field]: last.oldValue } as any]);
  }

  async function undoAll() {
    setRows(originalRows);
    setEditEvents([]);
    setRedoEvents([]);
  }

  function redo() {
    const last = redoEvents[redoEvents.length - 1];
    if (!last) return;
    setRedoEvents((prev) => prev.slice(0, -1));
    setEditEvents((prev) => [...prev, last]);
    gridApiRef.current.updateRows([{ id: last.rowId, [last.field]: last.newValue } as any]);
  }

  const planningUtils = trpc.useUtils();
  const updatePlanning = trpc.planning.update.useMutation({
    onSuccess: async () => {
      await planningUtils.planning.search.invalidate();
    },
  });

  async function save() {
    const payload: Record<string, { year: number; amount: number | null }[]> = {};
    editEvents.forEach((e) => {
      payload[e.rowId] = payload[e.rowId] ?? [];
      payload[e.rowId].push({ year: e.year, amount: e.newValue });
    });
    await updatePlanning.mutateAsync(payload);
    setEditEvents([]);
    setRedoEvents([]);
  }

  return (
    <Box
      css={css`
        height: 100%;
        display: flex;
        flex-direction: column;
      `}
    >
      <Box
        css={css`
          display: flex;
          gap: 2rem;
          align-items: center;
          padding-bottom: 16px;
          padding-top: 12px;
        `}
      >
        <YearPicker
          selectedYear={dayjs(searchParams.objectStartDate).year()}
          onChange={(dates) =>
            setSearchParams({
              ...searchParams,
              objectStartDate: dates.startDate,
            })
          }
          allowAllYears={false}
        />

        <YearPicker
          selectedYear={dayjs(searchParams.objectEndDate).year()}
          onChange={(dates) =>
            setSearchParams({
              ...searchParams,
              objectEndDate: dates.endDate,
            })
          }
          allowAllYears={false}
        />
      </Box>
      <ProjectObjectParticipantFilter
        onChange={participantFilterChange}
        isChecked={!!searchParams.objectParticipantUser}
      />
      <WorkTableFilters
        searchParams={searchParams}
        setSearchParams={(value: SetStateAction<WorkTableSearch>) => setSearchParams(value as any)}
        yearRange={{
          startYear: dayjs(searchParams.objectStartDate).year(),
          endYear: dayjs(searchParams.objectEndDate).year(),
        }}
        readOnly={false}
        expanded={true}
        palmGroupingVisible={true}
      />
      <DataGrid
        slots={{ noRowsOverlay: () => <NoRowsOverlay label={tr('workTable.noData')} /> }}
        isCellEditable={({ row, field }) => canEditYear(field, row as PlanningRowWithYears)}
        getCellClassName={({ field, id, row }) => {
          const classNames: string[] = [];
          if (pinnedColumns.map((column) => column.name).includes(field)) {
            classNames.push(`pinned-${field}`);
          }
          if (String(field).startsWith('year')) {
            classNames.push('year-column');
            const mod = modifiedFields?.[id as string]?.[field];
            if (mod) {
              classNames.push('modified-cell');
            } else if (canEditYear(field, row as PlanningRowWithYears)) {
              classNames.push('cell-writable');
            } else {
              classNames.push('cell-readonly');
            }
          }
          return classNames.join(' ');
        }}
        disableVirtualization
        loading={planningData.isLoading}
        localeText={fiFI.components.MuiDataGrid.defaultProps.localeText}
        apiRef={gridApiRef}
        processRowUpdate={(newRow, oldRow) => {
          // detect changed year field
          const changedField = Object.keys(newRow).find(
            (k) => isYearField(k) && (newRow as any)[k] !== (oldRow as any)[k],
          );
          if (changedField) {
            const year = Number(changedField.replace('year', ''));
            const evt: EditEvent = {
              rowId: (newRow as any).id,
              field: changedField,
              year,
              oldValue: (oldRow as any)[changedField] ?? null,
              newValue: (newRow as any)[changedField] ?? null,
            };
            setEditEvents((prev) => [...prev, evt]);
            setRedoEvents([]);
          }
          return newRow as any;
        }}
        css={(theme) => dataGridStyle(theme, 15)}
        density={'standard'}
        columns={columns as any}
        rows={rows}
        rowSelection={false}
        initialState={{ pagination: { paginationModel: { page: 0, pageSize: 1000 } } }}
        pageSizeOptions={[100, 500, 1000]}
        onCellKeyDown={(_params, event) => {
          if (!['Enter', 'NumpadEnter', 'Backspace', 'Delete'].includes(event.key)) {
            event.stopPropagation();
          }
        }}
        getRowId={(row) => (row as any).id}
        disableColumnMenu
      />
      <Box
        css={(theme) => css`
          position: absolute;
          z-index: 100;
          bottom: 0.5rem;
          left: 1rem;
          align-items: center;
          display: flex;
          gap: 2rem;
          padding: ${theme.spacing(1)};
        `}
      >
        <Box
          css={(theme) => css`
            border-radius: 4px;
            border: solid ${theme.palette.primary.main};
            padding: ${theme.spacing(1)};
            background-color: white;
            visibility: ${editEvents.length > 0 || redoEvents.length > 0 ? 'visible' : 'hidden'};
            display: flex;
            gap: ${theme.spacing(1)};
          `}
        >
          <IconButton onClick={undo} disabled={editEvents.length === 0}>
            <Tooltip title={tr('genericForm.undo')}>
              <Undo />
            </Tooltip>
          </IconButton>
          <IconButton onClick={redo} disabled={redoEvents.length === 0}>
            <Tooltip title={tr('genericForm.redo')}>
              <Redo />
            </Tooltip>
          </IconButton>
          <Button
            variant="outlined"
            size="small"
            disabled={editEvents.length === 0}
            onClick={undoAll}
            endIcon={<Cancel />}
          >
            {tr('genericForm.cancelAll')}
          </Button>
          <Button
            variant="contained"
            size="small"
            disabled={editEvents.length === 0}
            onClick={save}
            endIcon={<Save />}
          >
            {tr('genericForm.save')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

interface GetColumnsParams {
  yearRange: { start: number; end: number };
  pinnedColumns: string[];
  planningData?: PlanningRowWithYears[];
  canEditYear: (field: string, row: PlanningRowWithYears) => boolean;
  modifiedFields: Record<string, Record<string, boolean>>;
  actualsByPo: Map<string, Record<number, number>>;
  tr: (key: string, ...args: any[]) => string;
}

function getColumns({
  yearRange,
  pinnedColumns,
  planningData,
  canEditYear,
  modifiedFields,
  actualsByPo,
  tr,
}: GetColumnsParams): GridColDef<PlanningRowWithYears>[] {
  //const tr = useTranslations();
  const columns: GridColDef<PlanningRowWithYears>[] = [];

  // Name column (pinned)
  columns.push({
    field: 'displayName' as any,
    headerName: `${tr('planningTable.nameHeader')}`,
    flex: 1,

    minWidth: 300,
    headerClassName: 'pinned-displayName',
    renderCell: (params: GridRenderCellParams<PlanningRowWithYears>) => {
      const displayName =
        params.row.type === 'project' ? params.row.projectName : params.row.projectObjectName;
      console.log('params', params);
      return (
        <Box
          css={css`
            display: flex;
            align-items: center;
            gap: 4px;
          `}
        >
          <b
            title={displayName ?? ''}
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
    const yearKey = `year${year}` as any;
    const currentYear = new Date().getFullYear();
    const isPastOrCurrent = year <= currentYear;

    columns.push({
      field: yearKey,
      headerName: `${year}`,
      width: isPastOrCurrent ? 175 : 120,
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
                width: 145px;
                justify-content: space-between;
                font-size: 10px;
                font-weight: 500;
                opacity: 0.9;
              `}
            >
              <Typography>{tr('planningTable.actual')}</Typography>
              <Typography>{tr('planningTable.amount')}</Typography>
            </Box>
          ) : (
            <Box
              css={css`
                font-size: 10px;
                font-weight: 500;
                opacity: 0.9;
              `}
            >
              <Typography>{tr('planningTable.amount')}</Typography>
            </Box>
          )}
        </Box>
      ),
      renderCell: (params: GridRenderCellParams<PlanningRowWithYears>) => {
        const amount = (params.row as any)[`year${year}`] as number | null;

        const actual =
          (params.row as any).type === 'projectObject'
            ? actualsByPo.get((params.row as any).id)?.[year] ?? null
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
      renderEditCell: (params: GridRenderEditCellParams) => {
        const { id, field, value, api } = params;
        const row = params.row as PlanningRowWithYears;
        const editable = canEditYear(String(field), row);
        if (!editable) {
          return <Box />;
        }
        return (
          <CurrencyInput
            autoFocus
            editing
            value={(value as number | null) ?? null}
            allowNegative={false}
            onChange={(val) => {
              api.setEditCellValue({ id, field, value: val });
            }}
            style={{ width: '100%', height: '100%', border: 'none', outline: 'none' }}
          />
        );
      },
      editable: true,
      cellClassName: 'cell-wrap-text financial-cell',
    });
  }

  // Apply common properties to all columns
  return columns.map((column) => ({
    ...column,
    filterable: false,
    sortable: false,
    resizable: false,
  }));
}
