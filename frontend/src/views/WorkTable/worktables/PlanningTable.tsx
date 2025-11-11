import { css } from '@emotion/react';
import { Cancel, ExpandLess, ExpandMore, Launch, Redo, Save, Undo } from '@mui/icons-material';
import { Box, Button, IconButton, Skeleton, Theme, Tooltip, Typography } from '@mui/material';
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
import { Link } from 'react-router-dom';

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

  /* Project row styling - bold text for all cells */
  & .project-row {
    font-weight: 600;
  }
  & .project-row .MuiDataGrid-cell {
    font-weight: 600;
  }

  /* Light blue background only for cells within project date range */
  & .project-row .project-year-in-range {
    background-color: #d6ebf5 !important;
  }
  & .project-row:hover .project-year-in-range {
    background-color: #c0ddef !important;
  }
  & .project-row .pinned-displayName {
    background-color: #d6ebf5 !important;
  }
  & .project-row:hover .pinned-displayName {
    background-color: #c0ddef !important;
  }
  & .project-row .estimate-value,
  & .project-row .actual-value {
    font-weight: 600 !important;
  }
  & .project-row b,
  & .project-row strong {
    font-weight: 600;
  }

  /* Sum row styling - pinned to bottom with distinct appearance */
  & .sum-row {
    background-color: #f0f0f0 !important;
    font-weight: 700;
    border-top: 2px solid ${theme.palette.primary.main};
  }
  & .sum-row .MuiDataGrid-cell {
    background-color: #f0f0f0 !important;
    font-weight: 700;
  }
  & .sum-row .pinned-displayName {
    background-color: #f0f0f0 !important;
  }
  & .sum-row .estimate-value,
  & .sum-row .actual-value {
    font-weight: 700 !important;
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
        ${
          idx === pinnedColumns.length - 1
            ? 'border-right: 1px solid var(--DataGrid-rowBorderColor);'
            : ''
        }
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
  }
  & .estimate-value {
    font-weight: 500;
  }
  & .actual-value {
    font-weight: 600;
  }
  & .project-object-row .actual-value {
    font-weight: 400;
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

  const [expanded, setExpanded] = useState(true);

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
  const debouncedSearchParams = useDebounce(searchParams, 500);
  const tr = useTranslations();

  // Start with default year range (current year to current year + 15)
  const defaultYearRange = {
    start: currentYear,
    end: currentYear + 15,
  };

  // Transform search params to include yearRange for backend
  const query = useMemo(() => {
    const startYear = debouncedSearchParams.objectStartDate
      ? dayjs(debouncedSearchParams.objectStartDate).year()
      : currentYear;
    const endYear = debouncedSearchParams.objectEndDate
      ? dayjs(debouncedSearchParams.objectEndDate).year()
      : currentYear + 15;

    return {
      ...debouncedSearchParams,
      yearRange: { start: startYear, end: endYear },
    };
  }, [debouncedSearchParams, currentYear]);

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
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());

  const gridApiRef = useGridApiRef();

  function toggleProjectCollapse(projectId: string) {
    setCollapsedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  }

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
        r[`year${y}`] = budgetAmount;
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

  function calculateUsedSearchParamsCount(searchParams: WorkTableSearch): number {
    return (Object.keys(searchParams) as (keyof WorkTableSearch)[]).reduce((count, key) => {
      if (key === 'objectEndDate') {
        return count;
      }
      if (key === 'objectStartDate') {
        if (dayjs(searchParams.objectStartDate).year() !== dayjs().year()) {
          return count + 1;
        }
        return count;
      }

      const keyValue = searchParams[key];
      if (Array.isArray(keyValue) && keyValue.length === 0) {
        return count;
      }
      if (typeof keyValue === 'string' && keyValue === '') {
        return count;
      }
      return count + 1;
    }, 0);
  }

  const searchParamsCount = useMemo(
    () => calculateUsedSearchParamsCount(searchParams),
    [searchParams],
  );

  function canEditYear(field: string, row: PlanningRowWithYears): boolean {
    if (!isYearField(field)) return false;
    if (row.type !== 'projectObject') return false;
    if (!auth) return false;
    const year = Number(field.replace('year', ''));
    const yearIsLocked = lockedYears?.includes(year);
    if (yearIsLocked) return false;
    const startYear = dayjs(row.objectDateRange?.startDate).year();
    const endYear = dayjs(row.objectDateRange?.endDate).year();
    const inRange = year >= startYear && year <= endYear;
    if (!inRange) return false;
    return isAdmin(auth.role) || hasPermission(auth, 'investmentFinancials.write');
  }

  const poIds = useMemo(
    () => Array.from(new Set(rows.filter((r) => r.type === 'projectObject').map((r) => r.id))),
    [rows],
  );

  const utils = trpc.useUtils();
  
  // Batched loading: enable queries in chunks to limit concurrent requests
  const batchSize = 10;
  const [enabledBatches, setEnabledBatches] = useState(1);
  
  // Gradually enable more batches as previous ones complete
  useEffect(() => {
    const totalBatches = Math.ceil(poIds.length / batchSize);
    if (enabledBatches < totalBatches) {
      const timer = setTimeout(() => {
        setEnabledBatches((prev) => Math.min(prev + 1, totalBatches));
      }, 500); // Enable next batch after 500ms
      return () => clearTimeout(timer);
    }
  }, [enabledBatches, poIds.length]);
  
  // Reset batches when poIds change
  useEffect(() => {
    setEnabledBatches(1);
  }, [poIds.join(',')]);
  
  const actualsQueries = useQueries({
    queries: poIds.map((id, idx) => {
      const batchIndex = Math.floor(idx / batchSize);
      const isEnabled = batchIndex < enabledBatches;
      
      return {
        queryKey: ['sapActuals', id, yearRange.start, yearRange.end],
        queryFn: () =>
          utils.sap.getYearlyActualsByProjectObjectId.fetch({
            projectObjectId: id,
            startYear: yearRange.start,
            endYear: yearRange.end,
          }),
        enabled: Boolean(id) && isEnabled,
        staleTime: 5 * 60 * 1000,
      };
    }),
  });

  // Progressive rendering: update map as individual queries complete
  const actualsByPo = useMemo(() => {
    const map = new Map<string, Record<number, number>>();
    actualsQueries.forEach((q, idx) => {
      const id = poIds[idx];
      // Only process queries that have completed successfully
      if (q.data) {
        const rec: Record<number, number> = {};
        q.data.forEach((d) => {
          rec[d.year] = d.total;
        });
        map.set(id, rec);
      }
    });
    return map;
  }, [
    // Update whenever any query's data changes (not just when ALL complete)
    actualsQueries.map((q) => q.dataUpdatedAt).join(','),
    poIds.join(','),
  ]);

  // Track individual loading states for better UX
  const actualsLoading = useMemo(
    () => actualsQueries.some((q) => q.isLoading || q.isFetching),
    [actualsQueries.map((q) => q.fetchStatus).join(',')],
  );

  const estimateSumsByProjectName = useMemo(() => {
    // Build per-project sums and track if any non-null values exist per year
    const sumMap = new Map<string, Record<number, number>>();
    const seenMap = new Map<string, Record<number, boolean>>();

    rows
      .filter((r) => r.type === 'projectObject')
      .forEach((r) => {
        const projectName = r.projectName as string;
        const sums = sumMap.get(projectName) ?? {};
        const seen = seenMap.get(projectName) ?? {};
        for (let y = yearRange.start; y <= yearRange.end; y++) {
          const v = r[`year${y}`] as number | null | undefined;
          if (v !== null && v !== undefined) {
            sums[y] = (sums[y] ?? 0) + v;
            seen[y] = true;
          } else if (seen[y] === undefined) {
            seen[y] = false;
          }
        }
        sumMap.set(projectName, sums);
        seenMap.set(projectName, seen);
      });

    const out = new Map<string, Record<number, number | null>>();
    sumMap.forEach((sums, projectName) => {
      const seen = seenMap.get(projectName) ?? {};
      const rec: Record<number, number | null> = {} as Record<number, number | null>;
      for (let y = yearRange.start; y <= yearRange.end; y++) {
        rec[y] = seen[y] ? sums[y] ?? 0 : null;
      }
      out.set(projectName, rec);
    });

    return out;
  }, [rows, yearRange.start, yearRange.end]);

  const actualSumsByProjectName = useMemo(() => {
    const map = new Map<string, Record<number, number | null>>();
    const poByProject = new Map<string, string[]>();

    rows
      .filter((r) => r.type === 'projectObject')
      .forEach((r) => {
        const projectName = r.projectName as string;
        const id = r.id as string;
        const arr = poByProject.get(projectName) ?? [];
        arr.push(id);
        poByProject.set(projectName, arr);
      });

    poByProject.forEach((poList, projectName) => {
      const rec: Record<number, number | null> = {} as Record<number, number | null>;
      for (let y = yearRange.start; y <= yearRange.end; y++) {
        let sum = 0;
        let seen = false;
        for (const poId of poList) {
          const v = actualsByPo.get(poId)?.[y];
          if (typeof v === 'number') {
            sum += v;
            seen = true;
          }
        }
        rec[y] = seen ? sum : null;
      }
      map.set(projectName, rec);
    });

    return map;
  }, [rows, yearRange.start, yearRange.end, actualsByPo]);

  // Calculate total sums across all projects
  const totalSumRow = useMemo(() => {
    const sumRow: any = {
      id: 'TOTAL_SUM_ROW',
      type: 'project' as const,
      projectId: 'total',
      projectName: tr('planningTable.total'),
      projectObjectName: null,
      projectDateRange: null,
      objectDateRange: null,
    };

    // Sum up estimates and actuals for each year from project rows only
    for (let y = yearRange.start; y <= yearRange.end; y++) {
      let estimateSum = 0;
      let actualSum = 0;
      let hasEstimate = false;
      let hasActual = false;

      estimateSumsByProjectName.forEach((yearData) => {
        const val = yearData[y];
        if (val !== null && val !== undefined) {
          estimateSum += val;
          hasEstimate = true;
        }
      });

      actualSumsByProjectName.forEach((yearData) => {
        const val = yearData[y];
        if (val !== null && val !== undefined) {
          actualSum += val;
          hasActual = true;
        }
      });

      sumRow[`year${y}`] = hasEstimate ? estimateSum : null;
      sumRow[`year${y}_actual`] = hasActual ? actualSum : null;
    }

    return sumRow;
  }, [estimateSumsByProjectName, actualSumsByProjectName, yearRange.start, yearRange.end, tr]);

  // Filter out project objects whose parent project is collapsed
  const visibleRows = useMemo(() => {
    return rows.filter((row) => {
      if (row.type === 'project') return true;
      // For project objects, check if parent project is collapsed
      return !collapsedProjects.has(row.projectId);
    });
  }, [rows, collapsedProjects]);

  // Add sum row to the end of rows for display
  const rowsWithSum = useMemo(() => {
    if (!totalSumRow || visibleRows.length === 0) return visibleRows;
    return [...visibleRows, totalSumRow];
  }, [visibleRows, totalSumRow]);

  const columns = useMemo(() => {
    return getColumns({
      yearRange,
      pinnedColumns: pinnedColumns.map((column) => column.name),
      planningData: rows,
      canEditYear,
      modifiedFields,
      actualsByPo,
      actualsLoading,
      estimateSumsByProjectName,
      actualSumsByProjectName,
      totalSumRow,
      collapsedProjects,
      toggleProjectCollapse,
      tr: tr as (key: string, ...args: any[]) => string,
    });
  }, [
    rows,
    yearRange.start,
    yearRange.end,
    lockedYears,
    auth,
    actualsByPo,
    actualsLoading,
    estimateSumsByProjectName,
    actualSumsByProjectName,
    totalSumRow,
    collapsedProjects,
    tr,
  ]);

  function undo() {
    const last = editEvents[editEvents.length - 1];
    if (!last) return;
    setEditEvents((prev) => prev.slice(0, -1));
    setRedoEvents((prev) => [...prev, last]);
    gridApiRef.current.updateRows([
      { id: last.rowId, [last.field]: last.oldValue } as Partial<PlanningRowWithYears>,
    ]);
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
    gridApiRef.current.updateRows([
      { id: last.rowId, [last.field]: last.newValue } as Partial<PlanningRowWithYears>,
    ]);
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
          label={tr('planningTable.startYear')}
          onChange={(dates) =>
            setSearchParams({
              ...searchParams,
              objectStartDate: dates.startDate,
            })
          }
          allowAllYears={false}
        />
        <Typography>—</Typography>
        <YearPicker
          selectedYear={dayjs(searchParams.objectEndDate).year()}
          label={tr('planningTable.endYear')}
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
        expanded={expanded}
        palmGroupingVisible={true}
      />

      <Button
        size="small"
        css={css`
          margin-left: auto;
        `}
        onClick={() => {
          setExpanded((prev) => !prev);
        }}
        endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
      >
        {expanded
          ? tr(
              searchParamsCount > 0 ? 'workTable.search.hideWithCount' : 'workTable.search.hide',
              searchParamsCount,
            )
          : tr(
              searchParamsCount > 0 ? 'workTable.search.showWithCount' : 'workTable.search.show',
              searchParamsCount,
            )}
      </Button>

      <DataGrid
        slots={{ noRowsOverlay: () => <NoRowsOverlay label={tr('workTable.noData')} /> }}
        showCellVerticalBorder
        showColumnVerticalBorder
        isCellEditable={({ row, field }) => canEditYear(field, row as PlanningRowWithYears)}
        getCellClassName={({ field, id, row }) => {
          const classNames: string[] = [];
          const typedRow = row as PlanningRowWithYears;
          if (pinnedColumns.map((column) => column.name).includes(field)) {
            classNames.push(`pinned-${field}`);
          }
          if (String(field).startsWith('year')) {
            classNames.push('year-column');
            const mod = modifiedFields?.[id as string]?.[field];
            if (mod) {
              classNames.push('modified-cell');
            } else if (canEditYear(field, typedRow)) {
              classNames.push('cell-writable');
            } else {
              classNames.push('cell-readonly');
            }

            // Add class for project year cells within project date range
            if (typedRow.type === 'project' && typedRow.projectDateRange) {
              const year = Number(field.replace('year', ''));
              const startYear = dayjs(typedRow.projectDateRange.startDate).year();
              const endYear = dayjs(typedRow.projectDateRange.endDate).year();
              if (year >= startYear && year <= endYear) {
                classNames.push('project-year-in-range');
              }
            }
          }
          // Add project-cell class for project rows to help with styling
          if (typedRow.type === 'project') {
            classNames.push('project-cell');
          }
          return classNames.join(' ');
        }}
        disableVirtualization
        loading={planningData.isLoading}
        localeText={fiFI.components.MuiDataGrid.defaultProps.localeText}
        apiRef={gridApiRef}
        processRowUpdate={(newRow, oldRow) => {
          // detect changed year field
          const changedField = Object.keys(newRow as PlanningRowWithYears).find(
            (k) =>
              isYearField(k) &&
              (newRow as PlanningRowWithYears)[k] !== (oldRow as PlanningRowWithYears)[k],
          );
          if (changedField) {
            const year = Number(changedField.replace('year', ''));
            const evt: EditEvent = {
              rowId: (newRow as PlanningRowWithYears).id,
              field: changedField,
              year,
              oldValue: (oldRow as PlanningRowWithYears)[changedField] ?? null,
              newValue: (newRow as PlanningRowWithYears)[changedField] ?? null,
            };
            setEditEvents((prev) => [...prev, evt]);
            setRedoEvents([]);
          }
          return newRow as PlanningRowWithYears;
        }}
        css={(theme) => dataGridStyle(theme, 15)}
        density={'standard'}
        columns={columns}
        rows={rowsWithSum}
        rowSelection={false}
        initialState={{ pagination: { paginationModel: { page: 0, pageSize: 1000 } } }}
        pageSizeOptions={[100, 500, 1000]}
        onCellKeyDown={(_params, event) => {
          if (!['Enter', 'NumpadEnter', 'Backspace', 'Delete'].includes(event.key)) {
            event.stopPropagation();
          }
        }}
        getRowId={(row: PlanningRowWithYears) => row.id}
        getRowClassName={(params) => {
          if (params.row.id === 'TOTAL_SUM_ROW') return 'sum-row';
          if (params.row.type === 'project') return 'project-row';
          if (params.row.type === 'projectObject') return 'project-object-row';
          return '';
        }}
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
  actualsLoading: boolean;
  estimateSumsByProjectName: Map<string, Record<number, number | null>>;
  actualSumsByProjectName: Map<string, Record<number, number | null>>;
  totalSumRow: PlanningRowWithYears;
  collapsedProjects: Set<string>;
  toggleProjectCollapse: (projectId: string) => void;
  tr: (key: string, ...args: any[]) => string;
}

function getColumns({
  yearRange,
  pinnedColumns,
  planningData,
  canEditYear,
  modifiedFields,
  actualsByPo,
  actualsLoading,
  estimateSumsByProjectName,
  actualSumsByProjectName,
  totalSumRow,
  collapsedProjects,
  toggleProjectCollapse,
  tr,
}: GetColumnsParams): GridColDef<PlanningRowWithYears>[] {
  const columns: GridColDef<PlanningRowWithYears>[] = [];

  // Name column (pinned)
  columns.push({
    field: 'displayName',
    headerName: `${tr('planningTable.nameHeader')}`,
    width: 400,
    maxWidth: 400,
    minWidth: 300,
    headerClassName: 'pinned-displayName',
    renderCell: (params: GridRenderCellParams<PlanningRowWithYears>) => {
      const isSumRow = params.row.id === 'TOTAL_SUM_ROW';
      const isProject = params.row.type === 'project';
      const displayName = isProject ? params.row.projectName : ` └ ${params.row.projectObjectName}`;

      const linkPath = isProject
        ? `/investointihanke/${params.row.projectId}`
        : `/investointihanke/${params.row.projectId}/kohde/${params.row.id}`;

      // Sum row just shows the label without link
      if (isSumRow) {
        return (
          <Box
            css={css`
              display: flex;
              align-items: center;
              padding-left: 4px;
            `}
          >
            <b>{params.row.projectName}</b>
          </Box>
        );
      }

      return (
        <Box
          css={css`
            display: flex;
            align-items: center;
            gap: 4px;
          `}
        >
          {isProject && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                toggleProjectCollapse(params.row.projectId);
              }}
              css={css`
                padding: 0;
                width: 24px;
                height: 24px;
              `}
            >
              {collapsedProjects.has(params.row.projectId) ? (
                <ExpandMore fontSize="small" />
              ) : (
                <ExpandLess fontSize="small" />
              )}
            </IconButton>
          )}
          <Link to={linkPath} target="_blank" rel="noopener noreferrer">
            <Launch fontSize={'small'} htmlColor="#aaa" />
          </Link>
          <b
            title={displayName ?? ''}
            css={css`
              max-height: 40px;
              display: -webkit-box;
              -webkit-box-orient: vertical;
              -webkit-line-clamp: 2;
              overflow: hidden;
              color: ${isProject ? '#2e7d32' : ''};
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
    const yearKey = `year${year}`;
    const currentYear = new Date().getFullYear();
    const isPastOrCurrent = year <= currentYear;

    columns.push({
      field: yearKey,
      headerName: `${year}`,
      width: isPastOrCurrent ? 230 : 130,
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
        const isSumRow = params.row.id === 'TOTAL_SUM_ROW';
        const isProjectObject = params.row.type === 'projectObject';
        const isProject = params.row.type === 'project';

        // For sum row, get the pre-calculated totals
        const amount = isSumRow
          ? (params.row[`year${year}`] as number | null) ?? null
          : isProjectObject
            ? (params.row[`year${year}`] as number | null) ?? null
            : isProject
              ? estimateSumsByProjectName.get(params.row.projectName)?.[year] ?? null
              : null;

        const actual = isSumRow
          ? (params.row[`year${year}_actual`] as number | null) ?? null
          : isProjectObject
            ? actualsByPo.get(params.row.id)?.[year] ?? null
            : isProject
              ? actualSumsByProjectName.get(params.row.projectName)?.[year] ?? null
              : null;

        const isLoadingActuals =
          !isSumRow && (isProjectObject || isProject) ? actualsLoading : false;

        return (
          <Box
            css={css`
              display: flex;
              flex-direction: row;
              width: 100%;
              justify-content: space-between;
              align-items: center;
              font-size: 11px;
              line-height: 1.2;
            `}
          >
            {isPastOrCurrent ? (
              <>
                <Box
                  className="actual-value"
                  css={css`
                    flex: 1;
                    text-align: left;
                    font-weight: ${isProject ? '600' : 'inherit'};
                    padding-right: 8px;
                  `}
                >
                  {isLoadingActuals ? (
                    <Skeleton variant="text" width="80%" height={14} />
                  ) : (
                    formatCurrency(actual)
                  )}
                </Box>
                <Box
                  css={css`
                    width: 1px;
                    background-color: #d0d0d0;
                    align-self: stretch;
                  `}
                />
                <Box
                  className="estimate-value"
                  css={css`
                    flex: 1;
                    text-align: right;
                    font-weight: ${isProject ? '600' : 'inherit'};
                    padding-left: 8px;
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
                  font-weight: ${isProject ? '600' : 'inherit'};
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
