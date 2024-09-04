import { css } from '@emotion/react';
import {
  AddCircleOutline,
  Cancel,
  Download,
  ExpandLess,
  ExpandMore,
  Redo,
  Save,
  Undo,
} from '@mui/icons-material';
import { Box, Button, Chip, IconButton, Theme, Tooltip, Typography } from '@mui/material';
import { DataGrid, useGridApiRef } from '@mui/x-data-grid';
import { fiFI } from '@mui/x-data-grid/locales';
import { atom, useAtom, useAtomValue } from 'jotai';
import diff from 'microdiff';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { AsyncJobButton } from '@frontend/components/AsyncJobButton';
import { SplitButton } from '@frontend/components/SplitButton';
import dayjs from '@frontend/dayjs';
import { useNotifications } from '@frontend/services/notification';
import { asyncUserAtom } from '@frontend/stores/auth';
import { useTranslations } from '@frontend/stores/lang';
import { useNavigationBlocker } from '@frontend/stores/navigationBlocker';
import { useDebounce } from '@frontend/utils/useDebounce';
import { WorkTableFilters } from '@frontend/views/WorkTable/Filters/WorkTableFilters';
import { WorkTableFinanceField, getColumns } from '@frontend/views/WorkTable/columns';

import { isoDateFormat } from '@shared/date';
import {
  hasPermission,
  hasWritePermission,
  isAdmin,
  ownsProject,
} from '@shared/schema/userPermissions';
import {
  ReportTemplate,
  WorkTableRow,
  WorkTableRowUpdate,
  WorkTableSearch,
} from '@shared/schema/workTable';

import { BackToTopButton } from './BackToTopButton';
import { ProjectObjectParticipantFilter } from './Filters/ProjectObjectParticipantFilter';
import { YearPicker } from './Filters/YearPicker';
import { WorkTableSummaryRow } from './WorkTableSummaryRow';
import { ModifiedFields } from './diff';

const pinnedColumns = [
  { name: 'projectLink', offset: 0 },
  { name: 'objectName', offset: 256 },
];

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

type UpdateableFields = keyof Omit<WorkTableRow, 'id' | 'projectLink'>;

export interface CellEditEvent {
  rowId: string;
  field: UpdateableFields;
  oldValue: WorkTableRow[keyof WorkTableRow];
  newValue: WorkTableRow[keyof WorkTableRow];
}

function getCellEditEvent(oldRow: WorkTableRow, newRow: WorkTableRow): CellEditEvent | null {
  const rowDiff = diff(oldRow, newRow);
  if (!rowDiff || rowDiff.length === 0) {
    return null;
  }

  // only consider the top level field which is sufficient for our purpose. No need
  // to produce more granular diffs.
  const changedField = rowDiff[0].path[0] as UpdateableFields;

  return {
    rowId: newRow.id,
    field: changedField,
    oldValue: oldRow[changedField],
    newValue: newRow[changedField],
  };
}
const thisYear = dayjs().year();
const searchAtom = atom<WorkTableSearch>({
  objectStartDate: dayjs([thisYear, 0, 1]).format(isoDateFormat).toString(),
  objectEndDate: dayjs([thisYear, 11, 31]).format(isoDateFormat).toString(),
});

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

export default function WorkTable() {
  const [searchParams, setSearchParams] = useAtom(searchAtom);
  const query = useDebounce(searchParams, 500);
  const tr = useTranslations();
  const gridApiRef = useGridApiRef();
  const summaryRowRef = useRef<HTMLElement>();
  const notify = useNotifications();
  const workTableScrollableElement = document.querySelector('.MuiDataGrid-virtualScroller');
  const [summaryRowHeight, setSummaryRowHeight] = useState(54);
  const [expanded, setExpanded] = useState(true);
  const [filterExpandTooltipOpen, setFilterExpandTooltipOpen] = useState(false);
  const auth = useAtomValue(asyncUserAtom);

  const { workTable } = trpc.useUtils();
  const [yearRange, setYearRange] = useState<{ startYear: number; endYear: number }>({
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear(),
  });

  // highlight for the newly created project object
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const [highlightId, setHighlightId] = useState<string | null>(queryParams.get('highlight'));
  const participatedProjects = trpc.investmentProject.getParticipatedProjects.useQuery();
  const workTableData = trpc.workTable.search.useQuery(query);
  const updateObjects = trpc.workTable.update.useMutation({
    onSuccess: async () => {
      await workTableData.refetch();
      setEditEvents([]);
      setRedoEvents([]);
      notify({
        title: tr('genericForm.notifySubmitSuccess'),
        severity: 'success',
        duration: 5000,
      });
    },
    onError: () => {
      notify({
        title: tr('genericForm.notifySubmitFailure'),
        severity: 'error',
      });
    },
  });

  const [editEvents, setEditEvents] = useState<CellEditEvent[]>([]);
  const [redoEvents, setRedoEvents] = useState<CellEditEvent[]>([]);

  useNavigationBlocker(editEvents.length > 0, 'worktable');

  const modifiedFields = useMemo(() => {
    const fields: ModifiedFields<WorkTableRow> = {};

    editEvents.forEach((editEvent) => {
      const { rowId, field } = editEvent;
      fields[rowId] = fields[rowId] ?? {};
      fields[rowId][field] = true;
    });

    return fields;
  }, [editEvents]);

  const allYearsSelected =
    dayjs(searchParams.objectStartDate).year() !== dayjs(searchParams.objectEndDate).year();

  const columns = useMemo(() => {
    return getColumns({
      modifiedFields,
      allYearsSelected,
      pinnedColumns: pinnedColumns.map((column) => column.name),
    });
  }, [modifiedFields, allYearsSelected]);

  useEffect(() => {
    setEditEvents([]);
    setRedoEvents([]);
  }, [query]);

  useEffect(() => {
    if (!workTableData.data) {
      return;
    }
    gridApiRef.current.setRows([...(workTableData.data as WorkTableRow[])]);

    const minYear = Math.min(
      ...workTableData.data.map((row) => new Date(row.objectDateRange.startDate).getFullYear()),
    );
    const maxYear = Math.max(
      ...workTableData.data.map((row) => new Date(row.objectDateRange.endDate).getFullYear()),
    );
    setYearRange({ startYear: minYear, endYear: maxYear });
  }, [workTableData.data]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (editEvents.length > 0) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  });

  useEffect(() => {
    if (workTableData.data && highlightId) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            const rowElement = document.querySelector(`[data-id='${highlightId}']`);
            if (rowElement) {
              rowElement.scrollIntoView({ behavior: 'smooth' });
              setTimeout(() => setHighlightId(null), 5000);
              observer.disconnect();
            }
          }
        });
      });

      observer.observe(document.body, { childList: true, subtree: true });

      return () => observer.disconnect();
    }
  }, [workTableData.data, highlightId]);

  function undo() {
    const lastEvent = editEvents.pop();
    if (!lastEvent) {
      return;
    }
    if (lastEvent) {
      setEditEvents([...editEvents]);
      setRedoEvents((prev) => [...prev, lastEvent]);
      const gridEvent = {
        id: lastEvent.rowId,
        [lastEvent.field]: lastEvent.oldValue,
      };
      gridApiRef.current.updateRows([gridEvent]);
    }
  }

  async function undoAll() {
    // refetch data from the backend
    await workTableData.refetch();
    gridApiRef.current.setRows([...(workTableData.data as WorkTableRow[])]);
    setEditEvents([]);
    setRedoEvents([]);
  }

  function redo() {
    const lastEvent = redoEvents.pop();
    if (lastEvent) {
      setEditEvents((prev) => [...prev, lastEvent]);
      const gridEvent = {
        id: lastEvent.rowId,
        [lastEvent.field]: lastEvent.newValue,
      };
      gridApiRef.current.updateRows([gridEvent]);
    }
  }

  async function update() {
    // NOTE: some problems with type inference, backend has schema validation however
    const updateData = {} as Record<string, Record<keyof WorkTableRowUpdate, any>>;
    editEvents.forEach((editEvent) => {
      const { rowId, field, newValue } = editEvent;
      updateData[rowId] = updateData[rowId] ?? {
        budgetYear: dayjs(searchParams.objectStartDate).year(),
      };
      updateData[rowId][field] = newValue;
    });

    updateObjects.mutateAsync(updateData);
  }

  function handleSummaryRowResize() {
    if (
      summaryRowRef?.current?.offsetHeight &&
      summaryRowHeight !== summaryRowRef.current.offsetHeight
    ) {
      setSummaryRowHeight(summaryRowRef.current.offsetHeight);
    }
  }

  function getWritableBudgetFields(
    permissionCtx: WorkTableRow['permissionCtx'],
  ): WorkTableFinanceField[] {
    if (!auth) return [];

    if (isAdmin(auth.role)) {
      return ['budget', 'forecast', 'kayttosuunnitelmanMuutos'];
    } else if (hasPermission(auth, 'investmentFinancials.write')) {
      return ['budget', 'kayttosuunnitelmanMuutos'];
    } else if (hasPermission(auth, 'investmentProject.write') || ownsProject(auth, permissionCtx)) {
      return ['forecast'];
    } else {
      return [];
    }
  }

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

  const workTableReportSettings: {
    title: string;
    reportTemplate: ReportTemplate;
  }[] = [
    { title: tr('workTable.printReport'), reportTemplate: 'print' },
    {
      title: tr('workTable.basicReport'),
      reportTemplate: 'basic',
    },
    {
      title: tr('workTable.expencesReport'),
      reportTemplate: 'expences',
    },
    {
      title: tr('workTable.rolesReport'),
      reportTemplate: 'roles',
    },
  ];

  function calculateUsedSearchParamsCount(searchParams: WorkTableSearch): number {
    return (Object.keys(searchParams) as (keyof WorkTableSearch)[]).reduce((count, key) => {
      if (['objectStartDate', 'objectEndDate', 'objectParticipantUser'].includes(key)) {
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
        `}
      >
        <Typography
          variant="h4"
          component="h1"
          data-testid="worktable-title"
          css={css`
            font-size: 1.8rem;
          `}
        >
          {tr('workTable.title')}
        </Typography>
        <YearPicker
          selectedYear={allYearsSelected ? 'allYears' : dayjs(searchParams.objectStartDate).year()}
          onChange={(dates) =>
            setSearchParams({
              ...searchParams,
              objectStartDate: dates.startDate,
              objectEndDate: dates.endDate,
            })
          }
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
          <SplitButton
            options={workTableReportSettings.map((setting) => setting.title)}
            renderButton={(label, selectedIndex) => (
              <AsyncJobButton
                variant="outlined"
                disabled={workTableData.isLoading || workTableData.data?.length === 0}
                title={
                  workTableData.isLoading || workTableData.data?.length === 0
                    ? tr('workTable.reportDisabled')
                    : undefined
                }
                onStart={async () => {
                  return workTable.startWorkTableReportJob.fetch({
                    ...query,
                    reportTemplate: workTableReportSettings[selectedIndex].reportTemplate,
                  });
                }}
                onError={() => {
                  notify({
                    title: tr('workTable.reportFailed'),
                    severity: 'error',
                  });
                }}
                onFinished={(jobId) => {
                  // Create a link element to automatically download the new report
                  const link = document.createElement('a');
                  link.href = `/api/v1/report/file?id=${jobId}`;
                  link.click();
                }}
                endIcon={<Download />}
              >
                {label}
              </AsyncJobButton>
            )}
          />

          <Button
            variant="contained"
            component={Link}
            to="/kohde/uusi?from=/investointiohjelma"
            endIcon={<AddCircleOutline />}
            disabled={
              !isAdmin(auth.role) &&
              (participatedProjects.isLoading || participatedProjects.data?.length === 0)
            }
          >
            {tr('workTable.newProjectObjectBtnLabel')}
          </Button>
        </Box>
      </Box>
      <WorkTableFilters
        expanded={expanded}
        readOnly={editEvents.length > 0}
        searchParams={searchParams}
        yearRange={yearRange}
        setSearchParams={setSearchParams}
      />
      <Box
        css={css`
          display: flex;
          align-items: center;
        `}
      >
        <WorkTableSummaryRow
          editEvents={editEvents}
          workTableData={workTableData}
          ref={summaryRowRef}
        />
        <Box
          css={css`
            display: flex;
            margin-left: auto;
            align-items: center;
          `}
        >
          {!expanded && searchParamsCount > 0 && (
            <Chip
              variant="outlined"
              css={css`
                font-size: 12px;
                border-color: orange;
              `}
              label={
                searchParamsCount === 1
                  ? tr('workTable.search.chipLabelSingle')
                  : tr('workTable.search.chipLabelMultiple', searchParamsCount)
              }
            />
          )}
          <Tooltip
            open={filterExpandTooltipOpen}
            onOpen={() => setFilterExpandTooltipOpen(true)}
            onClose={() => setFilterExpandTooltipOpen(false)}
            enterDelay={500}
            title={expanded ? tr('workTable.search.hide') : tr('workTable.search.show')}
          >
            <IconButton
              css={css`
                grid-column: 13;
                height: fit-content;
              `}
              onClick={() => {
                setExpanded((prev) => !prev);
                setFilterExpandTooltipOpen(false);
              }}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <DataGrid
        slots={{ noRowsOverlay: NoRowsOverlay }}
        onResize={handleSummaryRowResize}
        isCellEditable={({ row, field }: { row: WorkTableRow; field: string }) => {
          if (['budget', 'forecast', 'kayttosuunnitelmanMuutos'].includes(field)) {
            return getWritableBudgetFields(row.permissionCtx).includes(
              field as WorkTableFinanceField,
            );
          }
          return Boolean(
            auth &&
              (ownsProject(auth, row.permissionCtx) || hasWritePermission(auth, row.permissionCtx)),
          );
        }}
        getCellClassName={({ id, field, row }) => {
          const classNames = [];
          if (pinnedColumns.map((column) => column.name).includes(field)) {
            classNames.push(`pinned-${field}`);
          }
          if (id in modifiedFields && field in modifiedFields[id]) {
            classNames.push('modified-cell');
          } else if (
            auth &&
            (ownsProject(auth, row.permissionCtx) || hasWritePermission(auth, row.permissionCtx))
          ) {
            classNames.push('cell-writable');
          } else {
            classNames.push('cell-readonly');
          }
          return classNames.join(' ');
        }}
        disableVirtualization
        loading={workTableData.isLoading}
        localeText={fiFI.components.MuiDataGrid.defaultProps.localeText}
        apiRef={gridApiRef}
        processRowUpdate={(newRow, oldRow) => {
          const cellEditEvent = getCellEditEvent(oldRow, newRow);
          if (cellEditEvent) {
            setEditEvents((prev) => [...prev, cellEditEvent]);
            setRedoEvents([]);
          }

          return newRow;
        }}
        css={(theme) => dataGridStyle(theme, summaryRowHeight)}
        density={'standard'}
        columns={columns}
        rows={workTableData.data ?? []}
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
        getRowClassName={(params) => {
          if (params.id === highlightId) {
            return 'highlight';
          }
          return params.row.projectLink.projectIndex % 2 === 0 ? 'even' : 'odd';
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
        <BackToTopButton element={workTableScrollableElement} />
        <Box
          css={(theme) => {
            return css`
              border-radius: 4px;
              border: solid ${theme.palette.primary.main};
              padding: ${theme.spacing(1)};
              background-color: white;
              visibility: ${editEvents.length > 0 || redoEvents.length > 0 ? 'visible' : 'hidden'};
              display: flex;
              gap: ${theme.spacing(1)};
            `;
          }}
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
            disabled={editEvents.length === 0 || updateObjects.isLoading}
            onClick={undoAll}
            endIcon={<Cancel />}
          >
            {tr('genericForm.cancelAll')}
          </Button>
          <Button
            variant="contained"
            size="small"
            disabled={editEvents.length === 0 || updateObjects.isLoading}
            onClick={update}
            endIcon={<Save />}
          >
            {tr('genericForm.save')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
