import { css } from '@emotion/react';
import { AddCircleOutline, Cancel, Download, Redo, Save, Undo } from '@mui/icons-material';
import { Box, Button, IconButton, Theme, Tooltip, Typography } from '@mui/material';
import { DataGrid, fiFI, useGridApiRef } from '@mui/x-data-grid';
import { atom, useAtom, useAtomValue } from 'jotai';
import diff from 'microdiff';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { AsyncJobButton } from '@frontend/components/AsyncJobButton';
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
import { WorkTableRow, WorkTableRowUpdate, WorkTableSearch } from '@shared/schema/workTable';

import { BackToTopButton } from './BackToTopButton';
import { ProjectObjectParticipantFilter } from './Filters/ProjectObjectParticipantFilter';
import { YearPicker } from './Filters/YearPicker';
import { WorkTableSummaryRow } from './WorkTableSummaryRow';
import { ModifiedFields } from './diff';

const dataGridStyle = (theme: Theme, summaryRowHeight: number) => css`
  font-size: 12px;
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

  .highlight {
    animation-name: fadeInOut;
    animation-duration: 5000ms;
  }

  & .MuiDataGrid-main {
    overflow: visible;
  }

  & .MuiDataGrid-columnHeaders {
    background: ${theme.palette.primary.main};
    color: white;
    height: 45px !important;
    min-height: 0 !important;
    position: sticky;
    top: calc(${summaryRowHeight}px - 1rem);
    z-index: 100;
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
  startDate: dayjs([thisYear, 0, 1]).format(isoDateFormat).toString(),
  endDate: dayjs([thisYear, 11, 31]).format(isoDateFormat).toString(),
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
  const mainContentElement = document.getElementById('mainContentContainer');
  const [summaryRowHeight, setSummaryRowHeight] = useState(54);
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
    dayjs(searchParams.startDate).year() !== dayjs(searchParams.endDate).year();

  const columns = useMemo(() => {
    return getColumns({
      modifiedFields,
      allYearsSelected,
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
      ...workTableData.data.map((row) => new Date(row.dateRange.startDate).getFullYear()),
    );
    const maxYear = Math.max(
      ...workTableData.data.map((row) => new Date(row.dateRange.endDate).getFullYear()),
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
      updateData[rowId] = updateData[rowId] ?? { budgetYear: dayjs(searchParams.startDate).year() };
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
    } else if (hasPermission(auth, 'financials.write')) {
      return ['budget', 'kayttosuunnitelmanMuutos'];
    } else if (hasPermission(auth, 'investmentProject.write' || ownsProject(auth, permissionCtx))) {
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

  return (
    <Box
      css={css`
        display: flex;
        flex-direction: column;
        margin-bottom: 20px;
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
          selectedYear={allYearsSelected ? 'allYears' : dayjs(searchParams.startDate).year()}
          onChange={(dates) =>
            setSearchParams({
              ...searchParams,
              startDate: dates.startDate,
              endDate: dates.endDate,
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
          <AsyncJobButton
            variant="outlined"
            disabled={workTableData.isLoading || workTableData.data?.length === 0}
            title={
              workTableData.isLoading || workTableData.data?.length === 0
                ? tr('workTable.reportDisabled')
                : undefined
            }
            onStart={async () => {
              return workTable.startWorkTableReportJob.fetch(query);
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
            {tr('workTable.downloadReport')}
          </AsyncJobButton>
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
        readOnly={editEvents.length > 0}
        searchParams={searchParams}
        yearRange={yearRange}
        setSearchParams={setSearchParams}
      />
      <WorkTableSummaryRow
        editEvents={editEvents}
        workTableData={workTableData}
        ref={summaryRowRef}
      />
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
          if (id in modifiedFields && field in modifiedFields[id]) {
            return 'modified-cell';
          } else if (
            auth &&
            (ownsProject(auth, row.permissionCtx) || hasWritePermission(auth, row.permissionCtx))
          ) {
            return 'cell-writable';
          } else {
            return 'cell-readonly';
          }
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
        <BackToTopButton element={mainContentElement} />
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
