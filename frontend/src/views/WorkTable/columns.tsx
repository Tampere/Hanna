import { css } from '@emotion/react';
import { Launch } from '@mui/icons-material';
import {
  GridColDef,
  GridRenderCellParams,
  GridRenderEditCellParams,
  useGridApiContext,
} from '@mui/x-data-grid';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import { formatCurrency } from '@frontend/components/forms/CurrencyInput';
import { TableCodeCheckbox } from '@frontend/views/WorkTable/CodeCheckbox';
import { TableCodeSelect } from '@frontend/views/WorkTable/CodeSelect';
import { CodeSpanMulti } from '@frontend/views/WorkTable/CodeSpanMulti';
import { CurrencyEdit } from '@frontend/views/WorkTable/CurrencyEdit';
import { DateRangeEdit, DateRangeView } from '@frontend/views/WorkTable/DateRangePicker';
import { ProjectObjectUserEdit } from '@frontend/views/WorkTable/ProjectObjectUsers';

import { CodeSpan } from './CodeSpan';
import { ProjectObjectNameEdit } from './ProjectObjectNameEdit';
import { ModifiedFields } from './diff';

interface getColumnsParams {
  modifiedFields: ModifiedFields;
}

interface MaybeModifiedCellProps {
  params: GridRenderCellParams;
  children: React.ReactNode;
  modifiedFields?: ModifiedFields;
}

function MaybeModifiedCell({ params, children, modifiedFields }: MaybeModifiedCellProps) {
  const isModified = modifiedFields?.[params.id]?.[params.field];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref?.current?.parentElement && isModified) {
      ref.current.parentElement.style.backgroundColor = '#fffbdd';
    } else if (ref?.current?.parentElement && !isModified) {
      ref.current.parentElement.style.backgroundColor = 'inherit';
    }
  }, [ref, isModified]);

  return <div ref={ref}>{children}</div>;
}

export function getColumns({ modifiedFields }: getColumnsParams): GridColDef[] {
  const columns: GridColDef[] = [
    {
      field: 'projectObjectName',
      headerName: 'Kohde',
      width: 220,
      renderCell: (params: GridRenderCellParams) => (
        <MaybeModifiedCell params={params} modifiedFields={modifiedFields}>
          <b>{params.value}</b>
        </MaybeModifiedCell>
      ),
      renderEditCell: (params: GridRenderEditCellParams) => {
        const apiRef = useGridApiContext();
        return (
          <ProjectObjectNameEdit
            value={params.value}
            onChange={(newValue) => {
              apiRef.current.setEditCellValue({
                id: params.id,
                field: params.field,
                value: newValue,
              });

              apiRef.current.stopCellEditMode({
                id: params.id,
                field: params.field,
              });
            }}
          />
        );
      },
    },

    {
      field: 'projectObjectState',
      headerName: 'Tila',
      renderCell: (params: GridRenderCellParams) => (
        <MaybeModifiedCell params={params} modifiedFields={modifiedFields}>
          <CodeSpan codeListId={'KohteenElinkaarentila'} value={params.value} />
        </MaybeModifiedCell>
      ),
      renderEditCell: ({ id, field, value }: GridRenderEditCellParams) => {
        const apiRef = useGridApiContext();
        return (
          <TableCodeSelect
            codeListId="KohteenElinkaarentila"
            value={value}
            onChange={(newValue) => {
              apiRef.current.setEditCellValue({ id, field, value: newValue });
              apiRef.current.stopCellEditMode({ id, field, cellToFocusAfter: 'right' });
            }}
            onCancel={() => apiRef.current.stopCellEditMode({ id, field })}
          />
        );
      },
    },
    {
      field: 'projectDateRange',
      headerName: 'Toteutusväli',
      width: 112,
      renderCell: (params: GridRenderCellParams) => (
        <MaybeModifiedCell params={params} modifiedFields={modifiedFields}>
          <DateRangeView value={params.value} />{' '}
        </MaybeModifiedCell>
      ),
      renderEditCell: (params: GridRenderEditCellParams) => <DateRangeEdit {...params} />,
    },
    {
      field: 'projectLink',
      headerName: 'Hanke',
      width: 188,
      editable: false,
      renderCell: (params: GridRenderCellParams) => (
        <span
          css={css`
            display: flex;
            justify-content: center;
            align-items: center;
          `}
        >
          <Link
            to=""
            target="_blank"
            rel="noopener noreferrer"
            css={css`
              display: flex;
              align-items: center;
              cursor: pointer;
              color: inherit;
              text-decoration-line: underline;
              text-decoration-thickness: 2px;
              text-decoration-style: dotted;
              text-decoration-color: #999;
              text-underline-offset: 3px;
              margin-right: 2px;
            `}
          >
            {params.value}
            <Launch fontSize={'small'} htmlColor="#777" />
          </Link>
        </span>
      ),
    },
    {
      field: 'projectObjectType',
      headerName: 'Tyyppi',
      width: 160,
      renderCell: (params: GridRenderCellParams) => (
        <CodeSpanMulti codeListId={'KohdeTyyppi'} value={params.value} />
      ),
      renderEditCell({ id, field, value }: GridRenderEditCellParams) {
        const apiRef = useGridApiContext();
        return (
          <TableCodeCheckbox
            codeListId={'KohdeTyyppi'}
            value={value}
            onChange={(newValue) => {
              apiRef.current.setEditCellValue({ id, field, value: newValue });
              apiRef.current.stopCellEditMode({ id, field });
            }}
            onCancel={() => apiRef.current.stopCellEditMode({ id, field })}
          />
        );
      },
    },
    {
      field: 'projectObjectCategory',
      headerName: 'Omaisuusluokka',
      width: 160,
      renderCell: (params: GridRenderCellParams) => (
        <CodeSpanMulti codeListId={'KohteenOmaisuusLuokka'} value={params.value} />
      ),
      renderEditCell({ id, field, value }: GridRenderEditCellParams) {
        const apiRef = useGridApiContext();
        return (
          <TableCodeCheckbox
            codeListId={'KohteenOmaisuusLuokka'}
            value={value}
            onChange={(newValue) => {
              apiRef.current.setEditCellValue({ id, field, value: newValue });
              apiRef.current.stopCellEditMode({ id, field });
            }}
            onCancel={() => apiRef.current.stopCellEditMode({ id, field })}
          />
        );
      },
    },
    {
      field: 'projectObjectUsage',
      headerName: 'Käyttötarkoitus',
      width: 172,
      renderCell: (params: GridRenderCellParams) => (
        <CodeSpanMulti codeListId={'KohteenToiminnallinenKayttoTarkoitus'} value={params.value} />
      ),
      renderEditCell({ id, field, value }: GridRenderEditCellParams) {
        const apiRef = useGridApiContext();
        return (
          <TableCodeCheckbox
            codeListId={'KohteenToiminnallinenKayttoTarkoitus'}
            value={value}
            onChange={(newValue) => {
              apiRef.current.setEditCellValue({ id, field, value: newValue });
              apiRef.current.stopCellEditMode({ id, field });
            }}
            onCancel={() => apiRef.current.stopCellEditMode({ id, field })}
          />
        );
      },
    },
    {
      field: 'projectObjectPersonInfo',
      headerName: 'Rakennuttaja / Suunnittelija',
      width: 144,
      renderCell: ({ value }: GridRenderCellParams) => (
        <div
          css={css`
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          `}
        >
          <div>{value.rakennuttajaUser}</div>
          <div>{value.suunnittelluttajaUser}</div>
        </div>
      ),
      renderEditCell: ({ id, field, value }: GridRenderEditCellParams) => {
        const apiRef = useGridApiContext();
        return (
          <ProjectObjectUserEdit
            value={value}
            onChange={(newValue) => apiRef.current.setEditCellValue({ id, field, value: newValue })}
          />
        );
      },
    },
    {
      field: 'projectObjectFinances',
      headerName: 'Talousarvio / Toteuma',
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <div
          css={css`
            display: flex;
            flex-direction: column;
            align-items: flex-end;
          `}
        >
          <div>{formatCurrency(params.value.budget)}</div>
          <div>{formatCurrency(params.value.actual)}</div>
        </div>
      ),
      renderEditCell: ({ id, field, value }: GridRenderEditCellParams) => {
        const apiRef = useGridApiContext();
        return (
          <CurrencyEdit
            value={value.budget}
            commitValue={(newValue) => {
              apiRef.current.setEditCellValue({ id, field, value: { ...value, budget: newValue } });
              apiRef.current.stopCellEditMode({ id, field });
            }}
          />
        );
      },
    },
  ];

  // Set common fields and wrap cell render to MaybeModifiedCell to avoid repetition
  columns.forEach((column) => {
    const oldRenderCell = column.renderCell;
    column.editable = column.editable === false ? false : true;
    column.filterable = false;
    column.sortable = false;
    column.cellClassName = 'cell-wrap-text';
    column.renderCell = (params: GridRenderCellParams) =>
      oldRenderCell && (
        <MaybeModifiedCell params={params} modifiedFields={modifiedFields}>
          {oldRenderCell?.(params)}
        </MaybeModifiedCell>
      );
  });

  return columns;
}
