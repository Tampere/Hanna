import { css } from '@emotion/react';
import {
  Cancel,
  Download,
  ExpandLess,
  ExpandMore,
  Launch,
  Redo,
  Save,
  SubdirectoryArrowRight,
  Undo,
} from '@mui/icons-material';
import {
  Box,
  Button,
  IconButton,
  Popover,
  Skeleton,
  Theme,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridColumnGroupingModel,
  GridRenderCellParams,
  GridRenderEditCellParams,
} from '@mui/x-data-grid';
import { fiFI } from '@mui/x-data-grid/locales';
import { useQueries } from '@tanstack/react-query';
import { useAtom, useAtomValue } from 'jotai';
import { atomWithDefault } from 'jotai/utils';
import { type SetStateAction, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { AsyncJobButton } from '@frontend/components/AsyncJobButton';
import { CurrencyInput, formatCurrency } from '@frontend/components/forms/CurrencyInput';
import { SapActualsIcon } from '@frontend/components/icons/SapActuals';
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
type PlanningBudgetField = 'amount' | 'forecast' | 'estimate';

function getPlanningBudgetFieldForYear(year: number, currentYear: number): PlanningBudgetField {
  if (year > currentYear) return 'estimate';
  if (year === currentYear) return 'forecast';
  return 'amount';
}

function getPlanningValueForYear(
  row: PlanningTableRow,
  year: number,
  currentYear: number,
): number | null {
  if (row.type !== 'projectObject') return null;
  const budgetForYear = row.budget?.find((b) => b?.year === year);
  if (!budgetForYear) return null;
  return budgetForYear[getPlanningBudgetFieldForYear(year, currentYear)] ?? null;
}

function getPlanningAmountForYear(
  row: PlanningRowWithYears,
  year: number,
  currentYear: number,
): number | null {
  if (row.type !== 'projectObject') return null;
  if (year < currentYear) {
    return (row[`year${year}`] as number | null | undefined) ?? null;
  }
  const budgetForYear = row.budget?.find((b) => b?.year === year);
  return budgetForYear?.amount ?? null;
}

// A year is split into multiple grid columns. Each editable column maps to exactly one budget
// field, so we can rely on standard cell editing instead of multiplexing values through one cell.
function parseYearField(
  field: string,
): { year: number; kind: 'actual' | 'amount' | 'planned' } | null {
  let m = /^year(\d{4})__amount$/.exec(field);
  if (m) return { year: Number(m[1]), kind: 'amount' };
  m = /^year(\d{4})__actual$/.exec(field);
  if (m) return { year: Number(m[1]), kind: 'actual' };
  m = /^year(\d{4})$/.exec(field);
  if (m) return { year: Number(m[1]), kind: 'planned' };
  return null;
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
  /* Only highlight hovered cell, not the whole row */
  & .MuiDataGrid-row:hover {
    background-color: transparent;
  }
  & .MuiDataGrid-cell:hover {
    background-color: #e7eef9 !important;
  }
  & .MuiDataGrid-cell.year-column:hover {
    background-color: transparent !important;
  }
  & .MuiDataGrid-cell.year-column [data-planning-edit-target='editable']:hover {
    background-color: #e7eef9;
  }
  & .MuiDataGrid-cell.year-column [data-planning-edit-target='editable'] {
    align-self: stretch;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  /* Project row styling - bold text for all cells */
  & .project-row {
    font-weight: 600;
  }
  & .project-row .MuiDataGrid-cell {
    font-weight: 600;
  }

  /* Project rows: no special background tint */
  & .project-row .estimate-value,
  & .project-row .amount-value,
  & .project-row .actual-value {
    font-weight: 600 !important;
  }
  & .project-row b,
  & .project-row strong {
    font-weight: 600;
  }

  /* Sum row styling - pinned to bottom with distinct appearance */
  & .sum-row {
    background-color: #fff !important;
    font-weight: 700;
    border-top: 2px solid ${theme.palette.primary.main};
  }
  & .sum-row .MuiDataGrid-cell {
    background-color: #fff !important;
    font-weight: 700;
  }
  & .sum-row .pinned-displayName {
    background-color: #fff !important;
  }
  /* Sum row should not look disabled */
  & .sum-row .cell-readonly {
    background-color: #fff !important;
    color: inherit !important;
  }
  & .sum-row .cell-readonly .estimate-value,
  & .sum-row .cell-readonly .amount-value,
  & .sum-row .cell-readonly .actual-value {
    color: inherit !important;
  }
  & .sum-row .estimate-value,
  & .sum-row .amount-value,
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
  & .cell-readonly .amount-value,
  & .cell-readonly .actual-value {
    color: #7b7b7b !important;
  }

  & .MuiDataGrid-columnHeaders {
    position: sticky;
    top: calc(${summaryRowHeight}px - 1rem);
    z-index: 100;
  }
  & .MuiDataGrid-columnHeader {
    background: ${theme.palette.primary.main};
    color: white;
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
  & .MuiDataGrid-columnHeader.year-column .MuiDataGrid-columnHeaderTitleContainer {
    width: 100%;
    flex: 1;
    padding: 0;
  }
  & .MuiDataGrid-columnHeader.year-column .MuiDataGrid-columnHeaderTitleContainerContent {
    width: 100%;
    flex: 1;
    overflow: visible;
  }
  & .cell-wrap-text {
    white-space: normal !important;
    word-wrap: break-word;
  }
  & .MuiDataGrid-virtualScroller {
    min-height: 125px;
  }
  & .MuiDataGrid-scrollbar--horizontal {
    z-index: 102;
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
    year: number;
    budgetField: PlanningBudgetField;
    oldValue: number | null;
    newValue: number | null;
  };

  const [editEvents, setEditEvents] = useState<EditEvent[]>([]);
  const [redoEvents, setRedoEvents] = useState<EditEvent[]>([]);
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
  const [disabledInfo, setDisabledInfo] = useState<{
    anchorEl: HTMLElement | null;
    message: string;
  } | null>(null);

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
        r[`year${y}`] = getPlanningValueForYear(row, y, currentYear);
        if (y >= currentYear) {
          r[`year${y}__amount`] = getPlanningAmountForYear(r, y, currentYear);
        }
      }
      return r;
    });
  }, [planningData.data, yearRange.start, yearRange.end, currentYear]);

  const [rows, setRows] = useState<PlanningRowWithYears[]>(originalRows);

  useEffect(() => {
    setRows(originalRows);
    setEditEvents([]);
    setRedoEvents([]);
  }, [originalRows]);

  const modifiedFields = useMemo(() => {
    const map: Record<string, Record<string, boolean>> = {};
    editEvents.forEach((e) => {
      const gridField =
        e.budgetField === 'amount' && e.year >= currentYear
          ? `year${e.year}__amount`
          : `year${e.year}`;
      map[e.rowId] = map[e.rowId] ?? {};
      map[e.rowId][gridField] = true;
    });
    return map;
  }, [editEvents, currentYear]);

  function isYearField(field: string): boolean {
    return parseYearField(field) !== null;
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
  const canWritePlanningFinancials = Boolean(
    auth && (isAdmin(auth.role) || hasPermission(auth, 'investmentFinancials.write')),
  );

  function canEditYear(field: string, row: PlanningRowWithYears): boolean {
    const parsed = parseYearField(field);
    if (!parsed) return false;
    if (parsed.kind === 'actual') return false;
    if (row.type !== 'projectObject') return false;
    const year = parsed.year;
    const yearIsLocked = lockedYears?.includes(year);
    if (yearIsLocked) return false;
    const startYear = dayjs(row.objectDateRange?.startDate).year();
    const endYear = dayjs(row.objectDateRange?.endDate).year();
    const inRange = year >= startYear && year <= endYear;
    if (!inRange) return false;
    return canWritePlanningFinancials;
  }

  function setBudgetFieldForYear(
    row: PlanningRowWithYears,
    year: number,
    budgetField: PlanningBudgetField,
    value: number | null,
  ): PlanningRowWithYears {
    if (row.type !== 'projectObject') return row;
    const budget = [...(row.budget ?? [])];
    const idx = budget.findIndex((b) => b?.year === year);
    const existing = idx >= 0 ? budget[idx] : null;
    const updatedEntry = {
      year,
      amount: existing?.amount ?? null,
      forecast: existing?.forecast ?? null,
      estimate: existing?.estimate ?? null,
      actual: existing?.actual ?? null,
      [budgetField]: value,
    };

    if (idx >= 0) {
      budget[idx] = updatedEntry;
    } else {
      budget.push(updatedEntry);
    }

    return { ...row, budget } as PlanningRowWithYears;
  }

  function applyEditValueToRow(
    row: PlanningRowWithYears,
    year: number,
    budgetField: PlanningBudgetField,
    value: number | null,
  ): PlanningRowWithYears {
    // The grid field that holds this budget value: current/future amount lives in its own
    // `year${y}__amount` column, everything else (planned forecast/estimate and past amount)
    // lives in `year${y}`.
    const targetKey =
      budgetField === 'amount' && year >= currentYear ? `year${year}__amount` : `year${year}`;
    let next = { ...row, [targetKey]: value } as PlanningRowWithYears;
    if (year >= currentYear) {
      // Keep the budget array in sync so project/sum totals recompute correctly.
      next = setBudgetFieldForYear(next, year, budgetField, value);
    }
    return next;
  }

  function getYearDisabledReason(field: string, row: PlanningRowWithYears): string | null {
    const parsed = parseYearField(field);
    if (!parsed) return null;
    if (parsed.kind === 'actual') return null;
    if (row.type !== 'projectObject') return null;

    const year = parsed.year;

    if (lockedYears?.includes(year)) {
      return tr('planningTable.yearsDisable');
    }

    if (!row.objectDateRange?.startDate || !row.objectDateRange?.endDate) {
      return null;
    }

    const startYear = dayjs(row.objectDateRange.startDate).year();
    const endYear = dayjs(row.objectDateRange.endDate).year();
    const inRange = year >= startYear && year <= endYear;

    if (!inRange) {
      return tr('planningTable.yearOutOfRange');
    }

    if (!canWritePlanningFinancials) {
      return tr('planningTable.noPermissions');
    }

    return null;
  }

  const poIds = useMemo(
    () => Array.from(new Set(rows.filter((r) => r.type === 'projectObject').map((r) => r.id))),
    [rows],
  );

  const utils = trpc.useUtils();
  const { planning } = trpc.useUtils();

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

  // Per-project-object loading state for better UX
  const actualsLoadingByPo = useMemo(() => {
    const map = new Map<string, boolean>();
    actualsQueries.forEach((q, idx) => {
      const id = poIds[idx];
      map.set(id, q.isLoading || q.isFetching);
    });
    return map;
  }, [actualsQueries.map((q) => q.fetchStatus).join(','), poIds.join(',')]);

  // Project-level yearly SAP actuals (for SapActualsIcon on project rows)
  const projectIds = useMemo(
    () => Array.from(new Set(rows.filter((r) => r.type === 'project').map((r) => r.projectId))),
    [rows],
  );

  const projectActualsQueries = useQueries({
    queries: projectIds.map((projectId) => ({
      queryKey: ['sapProjectActuals', projectId, yearRange.start, yearRange.end],
      queryFn: () =>
        utils.sap.getYearlyActualsByProjectId.fetch({
          projectId,
          startYear: yearRange.start,
          endYear: yearRange.end,
        }),
      enabled: Boolean(projectId),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const sapActualsByProject = useMemo(() => {
    const map = new Map<string, Record<number, number>>();
    projectActualsQueries.forEach((q, idx) => {
      const projectId = projectIds[idx];
      const yearlyActuals = q.data?.yearlyActuals;
      if (yearlyActuals) {
        const rec: Record<number, number> = {};
        yearlyActuals.forEach((d) => {
          // Sum per year in case there are multiple rows
          rec[d.year] = (rec[d.year] ?? 0) + d.total;
        });
        map.set(projectId, rec);
      }
    });
    return map;
  }, [projectActualsQueries.map((q) => q.dataUpdatedAt).join(','), projectIds.join(',')]);

  const plannedSumsByProjectName = useMemo(() => {
    // Build per-project sums for the editable planning value (amount/forecast/estimate by year)
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

  const amountSumsByProjectName = useMemo(() => {
    // Build per-project sums for original amount values, which stay visible for current/future years
    const sumMap = new Map<string, Record<number, number>>();
    const seenMap = new Map<string, Record<number, boolean>>();

    rows
      .filter((r) => r.type === 'projectObject')
      .forEach((r) => {
        const projectName = r.projectName as string;
        const sums = sumMap.get(projectName) ?? {};
        const seen = seenMap.get(projectName) ?? {};
        for (let y = yearRange.start; y <= yearRange.end; y++) {
          const v = getPlanningAmountForYear(r, y, currentYear);
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
  }, [rows, yearRange.start, yearRange.end, currentYear]);

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

    // Sum up planned values, amount values, and actuals for each year
    for (let y = yearRange.start; y <= yearRange.end; y++) {
      let plannedSum = 0;
      let amountSum = 0;
      let actualSum = 0;
      let hasPlanned = false;
      let hasAmount = false;
      let hasActual = false;

      plannedSumsByProjectName.forEach((yearData) => {
        const val = yearData[y];
        if (val !== null && val !== undefined) {
          plannedSum += val;
          hasPlanned = true;
        }
      });

      amountSumsByProjectName.forEach((yearData) => {
        const val = yearData[y];
        if (val !== null && val !== undefined) {
          amountSum += val;
          hasAmount = true;
        }
      });

      actualSumsByProjectName.forEach((yearData) => {
        const val = yearData[y];
        if (val !== null && val !== undefined) {
          actualSum += val;
          hasActual = true;
        }
      });

      sumRow[`year${y}`] = hasPlanned ? plannedSum : null;
      sumRow[`year${y}_amount`] = hasAmount ? amountSum : null;
      sumRow[`year${y}_actual`] = hasActual ? actualSum : null;
    }

    return sumRow;
  }, [
    plannedSumsByProjectName,
    amountSumsByProjectName,
    actualSumsByProjectName,
    yearRange.start,
    yearRange.end,
    tr,
  ]);

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

  const { columns, columnGroupingModel } = useMemo(() => {
    return getColumns({
      yearRange,
      pinnedColumns: pinnedColumns.map((column) => column.name),
      planningData: rows,
      actualsByPo,
      actualsLoadingByPo,
      plannedSumsByProjectName,
      amountSumsByProjectName,
      actualSumsByProjectName,
      sapActualsByProject,
      totalSumRow,
      collapsedProjects,
      toggleProjectCollapse,
      currentYear,
      tr: tr as (key: string, ...args: any[]) => string,
    });
  }, [
    rows,
    yearRange.start,
    yearRange.end,
    lockedYears,
    auth,
    actualsByPo,
    actualsLoadingByPo,
    plannedSumsByProjectName,
    amountSumsByProjectName,
    actualSumsByProjectName,
    sapActualsByProject,
    totalSumRow,
    collapsedProjects,
    currentYear,
    tr,
  ]);

  function undo() {
    const last = editEvents[editEvents.length - 1];
    if (!last) return;
    setEditEvents((prev) => prev.slice(0, -1));
    setRedoEvents((prev) => [...prev, last]);
    setRows((prev) =>
      prev.map((row) =>
        row.id === last.rowId
          ? applyEditValueToRow(row, last.year, last.budgetField, last.oldValue)
          : row,
      ),
    );
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
    setRows((prev) =>
      prev.map((row) =>
        row.id === last.rowId
          ? applyEditValueToRow(row, last.year, last.budgetField, last.newValue)
          : row,
      ),
    );
  }

  const planningUtils = trpc.useUtils();
  const updatePlanning = trpc.planning.update.useMutation({
    onSuccess: async () => {
      await planningUtils.planning.search.invalidate();
    },
  });

  async function save() {
    const payload: Record<
      string,
      { year: number; field: PlanningBudgetField; value: number | null }[]
    > = {};
    editEvents.forEach((e) => {
      payload[e.rowId] = payload[e.rowId] ?? [];
      payload[e.rowId].push({
        year: e.year,
        field: e.budgetField,
        value: e.newValue,
      });
    });
    await updatePlanning.mutateAsync(payload);
    setEditEvents([]);
    setRedoEvents([]);
  }

  const handleCloseDisabledInfo = () => {
    setDisabledInfo(null);
  };

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
        <ProjectObjectParticipantFilter
          onChange={participantFilterChange}
          isChecked={!!searchParams.objectParticipantUser}
        />
        <Box
          css={css`
            display: flex;
            gap: 1rem;
            margin-left: auto;
          `}
        >
          <AsyncJobButton
            variant="outlined"
            disabled={planningData.isLoading || planningData.data?.length === 0}
            title={
              planningData.isLoading || planningData.data?.length === 0
                ? tr('workTable.reportDisabled')
                : undefined
            }
            onStart={async () => {
              return planning.startPlanningTableReportJob.fetch(query);
            }}
            onError={() => {
              console.error('Planning table report failed');
            }}
            onFinished={(jobId) => {
              const link = document.createElement('a');
              link.href = `/api/v1/report/file?id=${jobId}`;
              link.click();
            }}
            endIcon={<Download />}
          >
            {tr('planningTable.export.label')}
          </AsyncJobButton>
        </Box>
      </Box>
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
        columnGroupingModel={columnGroupingModel}
        columnHeaderHeight={32}
        isCellEditable={({ row, field }) => canEditYear(field, row as PlanningRowWithYears)}
        onCellClick={(params, event) => {
          const row = params.row as PlanningRowWithYears;
          const field = params.field as string;

          if (!isYearField(field)) return;
          if (canEditYear(field, row)) {
            // Single click starts editing the clicked segment column.
            params.api.startCellEditMode({ id: params.id, field });
            return;
          }

          const reason = getYearDisabledReason(field, row);
          if (!reason) return;

          event.stopPropagation();
          setDisabledInfo({
            anchorEl: event.currentTarget as HTMLElement,
            message: reason,
          });
        }}
        getCellClassName={({ field, id, row }) => {
          const classNames: string[] = [];
          const typedRow = row as PlanningRowWithYears;
          if (pinnedColumns.map((column) => column.name).includes(field)) {
            classNames.push(`pinned-${field}`);
          }
          const parsed = parseYearField(String(field));
          if (parsed) {
            classNames.push('year-column');
            const mod = modifiedFields?.[id as string]?.[field];
            if (mod) {
              classNames.push('modified-cell');
            } else if (!canEditYear(field, typedRow)) {
              classNames.push('cell-readonly');
            }

            // Add class for project year cells within project date range
            if (typedRow.type === 'project' && typedRow.projectDateRange) {
              const year = parsed.year;
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
        processRowUpdate={(newRow, oldRow) => {
          const nextRow = newRow as PlanningRowWithYears;
          const prevRow = oldRow as PlanningRowWithYears;
          // Each editable column maps to exactly one budget field, so the changed value can be found
          // reliably by diffing the candidate keys across the row's year range.
          for (let y = yearRange.start; y <= yearRange.end; y++) {
            for (const key of [`year${y}`, `year${y}__amount`]) {
              const oldValue = (prevRow[key] as number | null | undefined) ?? null;
              const newValue = (nextRow[key] as number | null | undefined) ?? null;
              if (oldValue === newValue) continue;
              const parsed = parseYearField(key);
              if (!parsed) continue;
              const budgetField =
                parsed.kind === 'amount' ? 'amount' : getPlanningBudgetFieldForYear(y, currentYear);
              const appliedRow = applyEditValueToRow(prevRow, y, budgetField, newValue);
              const evt: EditEvent = {
                rowId: nextRow.id as string,
                year: y,
                budgetField,
                oldValue,
                newValue,
              };
              setEditEvents((prev) => [...prev, evt]);
              setRedoEvents([]);
              setRows((prev) => prev.map((r) => (r.id === nextRow.id ? appliedRow : r)));
              return appliedRow;
            }
          }
          return nextRow;
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
      <Popover
        open={Boolean(disabledInfo?.anchorEl)}
        anchorEl={disabledInfo?.anchorEl}
        onClose={handleCloseDisabledInfo}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Box padding={1.5}>
          <Typography variant="body2">{disabledInfo?.message}</Typography>
        </Box>
      </Popover>
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
  currentYear: number;
  actualsByPo: Map<string, Record<number, number>>;
  actualsLoadingByPo: Map<string, boolean>;
  plannedSumsByProjectName: Map<string, Record<number, number | null>>;
  amountSumsByProjectName: Map<string, Record<number, number | null>>;
  actualSumsByProjectName: Map<string, Record<number, number | null>>;
  sapActualsByProject: Map<string, Record<number, number>>;
  totalSumRow: PlanningRowWithYears;
  collapsedProjects: Set<string>;
  toggleProjectCollapse: (projectId: string) => void;
  tr: (key: string, ...args: any[]) => string;
}

function getColumns({
  yearRange,
  currentYear,
  actualsByPo,
  actualsLoadingByPo,
  plannedSumsByProjectName,
  amountSumsByProjectName,
  actualSumsByProjectName,
  sapActualsByProject,
  collapsedProjects,
  toggleProjectCollapse,
  tr,
}: GetColumnsParams): {
  columns: GridColDef<PlanningRowWithYears>[];
  columnGroupingModel: GridColumnGroupingModel;
} {
  const columns: GridColDef<PlanningRowWithYears>[] = [];

  // Name column (pinned)
  columns.push({
    field: 'displayName',
    headerName: `${tr('planningTable.nameHeader')}`,
    width: 400,
    maxWidth: 400,
    minWidth: 320,
    headerClassName: 'pinned-displayName',
    renderCell: (params: GridRenderCellParams<PlanningRowWithYears>) => {
      const isSumRow = params.row.id === 'TOTAL_SUM_ROW';
      const isProject = params.row.type === 'project';
      const displayName = isProject ? params.row.projectName : params.row.projectObjectName;

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
          {!isProject && (
            <Box
              css={css`
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
              `}
            >
              <SubdirectoryArrowRight
                fontSize="small"
                css={css`
                  color: #9e9e9e;
                `}
              />
            </Box>
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

  // Each year is rendered as a group of real columns (actual / amount / planned), so every
  // editable value is its own cell mapped to a single budget field.
  const columnGroupingModel: GridColumnGroupingModel = [];

  const renderCurrencyEditCell = (params: GridRenderEditCellParams) => {
    const { id, field, value, api } = params;
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
  };

  for (let year = yearRange.start; year <= yearRange.end; year++) {
    const isPastYear = year < currentYear;
    const hasActualColumn = year <= currentYear;
    const planningBudgetField = getPlanningBudgetFieldForYear(year, currentYear);
    const plannedColumnLabel =
      planningBudgetField === 'forecast'
        ? tr('planningTable.forecast')
        : planningBudgetField === 'estimate'
          ? tr('planningTable.estimate')
          : tr('planningTable.amount');

    // Past years store the (editable) amount in `year${y}`; current/future years keep amount in a
    // dedicated `year${y}__amount` column and the planned forecast/estimate in `year${y}`.
    const amountColumnField = isPastYear ? `year${year}` : `year${year}__amount`;
    const groupChildren: { field: string }[] = [];

    if (hasActualColumn) {
      const actualField = `year${year}__actual`;
      groupChildren.push({ field: actualField });
      columns.push({
        field: actualField,
        headerName: tr('planningTable.actual'),
        width: 130,
        headerAlign: 'center',
        headerClassName: 'year-column',
        editable: false,
        cellClassName: 'cell-wrap-text financial-cell',
        renderCell: (params: GridRenderCellParams<PlanningRowWithYears>) => {
          const isSumRow = params.row.id === 'TOTAL_SUM_ROW';
          const isProjectObject = params.row.type === 'projectObject';
          const isProject = params.row.type === 'project';
          const actual = isSumRow
            ? (params.row[`year${year}_actual`] as number | null) ?? null
            : isProjectObject
              ? actualsByPo.get(params.row.id)?.[year] ?? null
              : isProject
                ? actualSumsByProjectName.get(params.row.projectName)?.[year] ?? null
                : null;
          const sapActual =
            isProject && sapActualsByProject.get(params.row.projectId)
              ? sapActualsByProject.get(params.row.projectId)?.[year] ?? null
              : null;
          const isLoadingActuals = isProjectObject
            ? actualsLoadingByPo.get(params.row.id) ?? false
            : false;
          return (
            <Box
              className="actual-value"
              css={css`
                display: flex;
                align-items: center;
                gap: 4px;
                width: 100%;
                font-weight: ${isProject ? '600' : 'inherit'};
              `}
            >
              {isLoadingActuals ? (
                <Skeleton variant="text" width="80%" height={14} />
              ) : (
                formatCurrency(actual)
              )}
              {isProject && sapActual != null && (
                <Box
                  css={css`
                    margin-left: auto;
                  `}
                >
                  <SapActualsIcon sapActual={sapActual} />
                </Box>
              )}
            </Box>
          );
        },
      });
    }

    groupChildren.push({ field: amountColumnField });
    columns.push({
      field: amountColumnField,
      headerName: tr('planningTable.amount'),
      width: 135,
      headerAlign: 'center',
      headerClassName: 'year-column',
      editable: true,
      cellClassName: 'cell-wrap-text financial-cell',
      renderCell: (params: GridRenderCellParams<PlanningRowWithYears>) => {
        const isSumRow = params.row.id === 'TOTAL_SUM_ROW';
        const isProject = params.row.type === 'project';
        const value = isSumRow
          ? (params.row[`year${year}_amount`] as number | null) ?? null
          : isProject
            ? amountSumsByProjectName.get(params.row.projectName)?.[year] ?? null
            : (params.value as number | null | undefined) ?? null;
        return (
          <Box
            className="amount-value"
            css={css`
              width: 100%;
              text-align: right;
              font-weight: ${isProject ? '600' : 'inherit'};
            `}
          >
            {formatCurrency(value) ?? '-'}
          </Box>
        );
      },
      renderEditCell: renderCurrencyEditCell,
    });

    if (!isPastYear) {
      groupChildren.push({ field: `year${year}` });
      columns.push({
        field: `year${year}`,
        headerName: plannedColumnLabel,
        width: 135,
        headerAlign: 'center',
        headerClassName: 'year-column',
        editable: true,
        cellClassName: 'cell-wrap-text financial-cell',
        renderCell: (params: GridRenderCellParams<PlanningRowWithYears>) => {
          const isSumRow = params.row.id === 'TOTAL_SUM_ROW';
          const isProject = params.row.type === 'project';
          const value = isSumRow
            ? (params.row[`year${year}`] as number | null) ?? null
            : isProject
              ? plannedSumsByProjectName.get(params.row.projectName)?.[year] ?? null
              : (params.value as number | null | undefined) ?? null;
          return (
            <Box
              className="estimate-value"
              css={css`
                width: 100%;
                text-align: right;
                font-weight: ${isProject ? '600' : 'inherit'};
              `}
            >
              {formatCurrency(value) ?? '-'}
            </Box>
          );
        },
        renderEditCell: renderCurrencyEditCell,
      });
    }

    columnGroupingModel.push({
      groupId: `yeargroup${year}`,
      headerName: `${year}`,
      headerAlign: 'center',
      headerClassName: 'year-column',
      children: groupChildren,
    });
  }

  // Apply common properties to all columns
  return {
    columns: columns.map((column) => ({
      ...column,
      filterable: false,
      sortable: false,
      resizable: false,
    })),
    columnGroupingModel,
  };
}
