import { css } from '@emotion/react';
import { Cancel, Redo, Save, Undo } from '@mui/icons-material';
import { Box, Button, IconButton, Theme, Tooltip } from '@mui/material';
import { DataGrid, fiFI, useGridApiRef } from '@mui/x-data-grid';
import { atom, useAtom } from 'jotai';
import diff from 'microdiff';
import { useEffect, useMemo, useState } from 'react';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { useDebounce } from '@frontend/utils/useDebounce';
import { WorkTableFilters } from '@frontend/views/WorkTable/WorkTableFilters';
import { getColumns } from '@frontend/views/WorkTable/columns';

import {
  ProjectsUpdate,
  WorkTableRow,
  WorkTableRowUpdate,
  WorkTableSearch,
} from '@shared/schema/workTable';

import { ModifiedFields } from './diff';

const dataGridStyle = (theme: Theme) => css`
  font-size: 12px;
  .odd {
    background-color: #f3f3f3;
  }
  & .MuiDataGrid-columnHeader {
    background: ${theme.palette.primary.main};
    color: white;
  }
  & .MuiDataGrid-columnHeaderTitle {
    line-height: normal;
    white-space: normal !important;
    word-wrap: break-word;
  }
  & .cell-bold {
    font-weight: bold;
  }
  & .cell-wrap-text {
    white-space: normal !important;
    word-wrap: break-word;
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

const searchAtom = atom<WorkTableSearch>({});

export default function WorkTable() {
  const [searchParams, setSearchParams] = useAtom(searchAtom);
  const query = useDebounce(searchParams, 500);
  const tr = useTranslations();
  const gridApiRef = useGridApiRef();
  const notify = useNotifications();

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

  const columns = useMemo(() => {
    return getColumns({ modifiedFields });
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
      updateData[rowId] = updateData[rowId] ?? {};
      updateData[rowId][field] = newValue;
    });

    updateObjects.mutateAsync(updateData);
  }

  return (
    <div>
      <WorkTableFilters
        readOnly={editEvents.length > 0}
        searchParams={searchParams}
        setSearchParams={setSearchParams}
      />
      <DataGrid
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
        autoHeight
        hideFooter
        getRowClassName={(params) => (params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd')}
        disableColumnMenu
      />
      {(editEvents.length > 0 || redoEvents.length > 0) && (
        <Box
          css={(theme) => css`
            padding: ${theme.spacing(1)};
            display: flex;
            justify-content: space-between;
          `}
        >
          <div
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
          </div>

          <div
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
          </div>
        </Box>
      )}
    </div>
  );
}
