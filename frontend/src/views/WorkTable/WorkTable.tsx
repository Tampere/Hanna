import { css } from '@emotion/react';
import { AddCircleOutline, Cancel, Redo, Save, Undo } from '@mui/icons-material';
import { Box, Button, IconButton, Theme, Tooltip, Typography } from '@mui/material';
import { DataGrid, fiFI, useGridApiRef } from '@mui/x-data-grid';
import { atom, useAtom, useAtomValue } from 'jotai';
import diff from 'microdiff';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { authAtom } from '@frontend/stores/auth';
import { useTranslations } from '@frontend/stores/lang';
import { useDebounce } from '@frontend/utils/useDebounce';
import { WorkTableFilters } from '@frontend/views/WorkTable/WorkTableFilters';
import { WorkTableFinanceField, getColumns } from '@frontend/views/WorkTable/columns';

import {
  hasPermission,
  hasWritePermission,
  isAdmin,
  ownsProject,
} from '@shared/schema/userPermissions';
import { WorkTableRow, WorkTableRowUpdate, WorkTableSearch } from '@shared/schema/workTable';

import { ModifiedFields } from './diff';

const dataGridStyle = (theme: Theme) => css`
  height: 100%;
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
  & .MuiDataGrid-columnHeaders {
    background: ${theme.palette.primary.main};
    color: white;
  }
  & .MuiDataGrid-columnHeaderTitle {
    line-height: normal;
    white-space: normal !important;
    word-wrap: break-word;
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
  const notify = useNotifications();
  const auth = useAtomValue(authAtom);

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

  const modifiedFields = useMemo(() => {
    const fields: ModifiedFields<WorkTableRow> = {};

    editEvents.forEach((editEvent) => {
      const { rowId, field } = editEvent;
      fields[rowId] = fields[rowId] ?? {};
      fields[rowId][field] = true;
    });

    return fields;
  }, [editEvents]);

  const columns = getColumns({ financesRange: searchParams.financesRange });

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
      ...workTableData.data.map((row) => new Date(row.dateRange.startDate).getFullYear())
    );
    const maxYear = Math.max(
      ...workTableData.data.map((row) => new Date(row.dateRange.endDate).getFullYear())
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

  function getWritableBudgetFields(
    permissionCtx: WorkTableRow['permissionCtx']
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

  return (
    <Box
      css={css`
        display: flex;
        flex-direction: column;
        height: 100%;
      `}
    >
      <Box
        css={css`
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        `}
      >
        <Typography variant="h4">{tr('workTable.title')}</Typography>
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
      <DataGrid
        isCellEditable={({ row, field }: { row: WorkTableRow; field: string }) => {
          if (['budget', 'forecast', 'kayttosuunnitelmanMuutos'].includes(field)) {
            return getWritableBudgetFields(row.permissionCtx).includes(
              field as WorkTableFinanceField
            );
          }
          return Boolean(
            auth &&
              (ownsProject(auth, row.permissionCtx) || hasWritePermission(auth, row.permissionCtx))
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
        css={dataGridStyle}
        density={'standard'}
        columns={columns}
        rows={workTableData.data ?? []}
        rowSelection={false}
        hideFooter
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
              event.clientY
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
          return params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd';
        }}
        disableColumnMenu
      />
      <Box
        css={(theme) => css`
          padding: ${theme.spacing(1)};
          display: flex;
          justify-content: space-between;
          visibility: ${editEvents.length > 0 || redoEvents.length > 0 ? 'visible' : 'hidden'};
        `}
      >
        <Box
          css={(theme) => {
            return css`
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
        </Box>

        <Box
          css={(theme) => {
            return css`
              display: flex;
              gap: ${theme.spacing(1)};
            `;
          }}
        >
          <Button
            variant="outlined"
            size="small"
            disabled={editEvents.length === 0 || updateObjects.isLoading}
            onClick={undoAll}
          >
            {tr('genericForm.cancelAll')}
            <Cancel />
          </Button>
          <Button
            variant="contained"
            size="small"
            disabled={editEvents.length === 0 || updateObjects.isLoading}
            onClick={update}
          >
            {tr('genericForm.save')}
            <Save />
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
