import { css } from '@emotion/react';
import { Cancel, Redo, Save, Undo } from '@mui/icons-material';
import { Box, Button, IconButton, Theme, Tooltip } from '@mui/material';
import { DataGrid, GridRowId, useGridApiRef } from '@mui/x-data-grid';
import { atom, useAtom } from 'jotai';
import diff from 'microdiff';
import { useEffect, useMemo, useState } from 'react';

import { useTranslations } from '@frontend/stores/lang';
import { useDebounce } from '@frontend/utils/useDebounce';
import { WorkTableFilters } from '@frontend/views/WorkTable/WorkTableFilters';
import { getColumns } from '@frontend/views/WorkTable/columns';
import { PLACEHOLDER_ROWS } from '@frontend/views/WorkTable/placeholder';

import { WorkTableSearch } from '@shared/schema/workTable';

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

interface GridRow {
  id: number;
  projectObjectName: string;
  projectObjectState: string;
  projectDateRange: {
    startDate: string;
    endDate: string;
  };
  projectLink: string;
  projectObjectType: string[];
  projectObjectCategory: string[];
  projectObjectUsage: string[];
  projectObjectPersonInfo: {
    rakennuttajaUser: string;
    suunnittelluttajaUser: string;
  };
  projectObjectFinances: {
    budget: number;
    actual: number;
  };
}

interface CellEditEvent {
  rowId: GridRowId;
  field: keyof GridRow;
  oldValue: GridRow[keyof GridRow];
  newValue: GridRow[keyof GridRow];
}

function getCellEditEvent(oldRow: GridRow, newRow: GridRow): CellEditEvent | null {
  const rowDiff = diff(oldRow, newRow);
  if (!rowDiff || rowDiff.length === 0) {
    return null;
  }

  // only consider the top level field which is sufficient for our purpose. No need
  // to produce more granular diffs.
  const changedField = rowDiff[0].path[0] as keyof GridRow;

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

  const [editEvents, setEditEvents] = useState<CellEditEvent[]>([]);
  const [redoEvents, setRedoEvents] = useState<CellEditEvent[]>([]);

  const modifiedFields = useMemo(() => {
    const modifiedFields: ModifiedFields<GridRow> = {};

    editEvents.forEach((editEvent) => {
      const { rowId, field } = editEvent;
      modifiedFields[rowId] = modifiedFields[rowId] ?? {};
      modifiedFields[rowId][field] = true;
    });

    return modifiedFields;
  }, [editEvents]);

  const columns = useMemo(() => {
    return getColumns({ modifiedFields });
  }, [modifiedFields]);

  const gridApiRef = useGridApiRef();

  useEffect(() => {
    // TODO: do the search
  }, [query]);

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

  function undoAll() {
    setEditEvents([]);
    setRedoEvents([]);
    PLACEHOLDER_ROWS.forEach((row) => {
      gridApiRef.current.updateRows([row]);
    });
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

  return (
    <div>
      <WorkTableFilters searchParams={searchParams} setSearchParams={setSearchParams} />
      <DataGrid
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
        rows={PLACEHOLDER_ROWS}
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
              disabled={editEvents.length === 0}
              onClick={undoAll}
            >
              {tr('genericForm.cancelAll')}
              <Cancel />
            </Button>
            <Button variant="contained" size="small" disabled={editEvents.length === 0}>
              {tr('genericForm.save')}
              <Save />
            </Button>
          </div>
        </Box>
      )}
    </div>
  );
}
