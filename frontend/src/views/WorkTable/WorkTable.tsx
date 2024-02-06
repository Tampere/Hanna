import { css } from '@emotion/react';
import { AddCircleOutline, Cancel, Redo, Save, Undo } from '@mui/icons-material';
import { Box, Button, IconButton, Theme, Tooltip, Typography } from '@mui/material';
import { DataGrid, fiFI, useGridApiRef } from '@mui/x-data-grid';
import { atom, useAtom } from 'jotai';
import diff from 'microdiff';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { useNavigationBlocker } from '@frontend/stores/navigationBlocker';
import { useDebounce } from '@frontend/utils/useDebounce';
import { WorkTableFilters } from '@frontend/views/WorkTable/WorkTableFilters';
import { getColumns } from '@frontend/views/WorkTable/columns';

import { WorkTableRow, WorkTableRowUpdate, WorkTableSearch } from '@shared/schema/workTable';

import { BackToTopButton } from './BackToTopButton';
import { ModifiedFields } from './diff';

const dataGridStyle = (theme: Theme, summaryRowHeight: number) => css`
  font-size: 12px;
  .odd {
    background-color: #f3f3f3;
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
`;

type UpdateableFields = keyof Omit<WorkTableRow, 'id' | 'projectLink'>;

interface CellEditEvent {
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

const searchAtom = atom<WorkTableSearch>({
  financesRange: new Date().getFullYear(),
});

export default function WorkTable() {
  const [searchParams, setSearchParams] = useAtom(searchAtom);
  const query = useDebounce(searchParams, 500);
  const tr = useTranslations();
  const gridApiRef = useGridApiRef();
  const summaryRowRef = useRef<HTMLElement>();
  const notify = useNotifications();
  const mainContentElement = document.getElementById('mainContentContainer');
  const [summaryRowHeight, setSummaryRowHeight] = useState(54);

  const [yearRange, setYearRange] = useState<{ startYear: number; endYear: number }>({
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear(),
  });

  // highlight for the newly created project object
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const highlightId = queryParams.get('highlight');

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

  const columns = useMemo(() => {
    return getColumns({ modifiedFields, financesRange: searchParams.financesRange });
  }, [modifiedFields]);

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
      updateData[rowId] = updateData[rowId] ?? { budgetYear: searchParams.financesRange };
      updateData[rowId][field] = newValue;
    });

    updateObjects.mutateAsync(updateData);
  }

  function calculateRowSum(values: number[]) {
    return values.reduce((sum, value) => sum + value, 0) / 100;
  }

  function getSummaryData(
    fieldName: 'budget' | 'actual' | 'forecast' | 'kayttosuunnitelmanMuutos',
  ) {
    const eurFormat = new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: 'EUR',
    });

    if (!workTableData?.data) {
      return eurFormat.format(0);
    }
    const sum = calculateRowSum(
      workTableData.data
        .map((data: WorkTableRow) =>
          Number(
            editEvents.find((event) => event.rowId === data.id && event.field === fieldName)
              ?.newValue ?? data[fieldName],
          ),
        )
        .filter((data) => !isNaN(data)),
    );

    return eurFormat.format(sum);
  }

  function handleSummaryRowResize() {
    if (
      summaryRowRef?.current?.offsetHeight &&
      summaryRowHeight !== summaryRowRef.current.offsetHeight
    ) {
      setSummaryRowHeight(summaryRowRef.current.offsetHeight);
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
          justify-content: space-between;
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
        <Button
          variant="contained"
          component={Link}
          to="/kohde/uusi?from=/investointiohjelma"
          endIcon={<AddCircleOutline />}
        >
          {tr('workTable.newProjectObjectBtnLabel')}
        </Button>
      </Box>
      <WorkTableFilters
        readOnly={editEvents.length > 0}
        searchParams={searchParams}
        yearRange={yearRange}
        setSearchParams={setSearchParams}
      />

      <Box
        ref={summaryRowRef}
        css={(theme) => css`
          display: flex;
          flex-wrap: wrap;
          margin: 0 -1rem;
          padding: 1rem;
          gap: 1.5rem;
          position: sticky;
          top: -1rem;
          z-index: 100;
          outline: solid white;
          background-color: white;
          min-height: 54px;
          p {
            font-size: 0.9rem;
            white-space: nowrap;
          }
          .summaryContainer {
            display: flex;
            gap: 10px;
            align-items: flex-end;
          }
          .summaryLabel {
            font-weight: 600;
            white-space: nowrap;
            color: ${theme.palette.primary.main};
          }
        `}
      >
        <Box className="summaryContainer">
          <Typography className="summaryLabel">{tr('workTable.summary.budget')}:</Typography>
          <Typography>{getSummaryData('budget')}</Typography>
        </Box>
        <Box className="summaryContainer">
          <Typography className="summaryLabel">{tr('workTable.summary.actual')}:</Typography>
          <Typography>{getSummaryData('actual')}</Typography>
        </Box>
        <Box className="summaryContainer">
          <Typography className="summaryLabel">{tr('workTable.summary.forecast')}:</Typography>
          <Typography>{getSummaryData('forecast')}</Typography>
        </Box>
        <Box className="summaryContainer">
          <Typography className="summaryLabel" style={{ whiteSpace: 'normal' }}>
            {tr('workTable.summary.kayttosuunnitelmanMuutos')}:
          </Typography>
          <Typography>{getSummaryData('kayttosuunnitelmanMuutos')}</Typography>
        </Box>
      </Box>

      <DataGrid
        onResize={handleSummaryRowResize}
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
        getRowId={(row) => row.id}
        getRowClassName={(params) => {
          if (params.id === highlightId) {
            return 'highlight';
          }
          return params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd';
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
