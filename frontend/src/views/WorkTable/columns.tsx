import { css } from '@emotion/react';
import { Launch } from '@mui/icons-material';
import {
  GridColDef,
  GridRenderCellParams,
  GridRenderEditCellParams,
  GridValidRowModel,
} from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import { TableCodeCheckbox } from '@frontend/views/WorkTable/CodeCheckbox';
import { TableCodeSelect } from '@frontend/views/WorkTable/CodeSelect';
import { CodeSpanMulti } from '@frontend/views/WorkTable/CodeSpanMulti';
import { CurrencyEdit } from '@frontend/views/WorkTable/CurrencyEdit';
import { DateRangeEdit, DateRangeView } from '@frontend/views/WorkTable/DateRangePicker';
import { Finances } from '@frontend/views/WorkTable/Finances';
import {
  ProjectObjectUserEdit,
  ProjectObjectUsers,
} from '@frontend/views/WorkTable/ProjectObjectUsers';

import { FinancesRange, WorkTableRow } from '@shared/schema/workTable';

import { CodeSpan } from './CodeSpan';
import { ProjectObjectNameEdit } from './ProjectObjectNameEdit';
import { ModifiedFields } from './diff';

interface GetColumnsParams {
  modifiedFields: ModifiedFields<WorkTableRow>;
  financesRange: FinancesRange;
}

interface MaybeModifiedCellProps<T extends GridValidRowModel> {
  params: GridRenderCellParams<T>;
  children: React.ReactNode;
  modifiedFields?: ModifiedFields<T>;
}

function isFinanceEditingDisabled(row: WorkTableRow, financesRange: FinancesRange) {
  if (financesRange === 'allYears') {
    return true;
  }

  const startYear = dayjs(row.dateRange.startDate).year();
  const endYear = dayjs(row.dateRange.endDate).year();

  return financesRange < startYear || financesRange > endYear;
}

function MaybeModifiedCell({
  params,
  children,
  modifiedFields,
}: MaybeModifiedCellProps<WorkTableRow>) {
  const isModified = modifiedFields?.[params.id]?.[params.field as keyof WorkTableRow];
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

export function getColumns({
  modifiedFields,
  financesRange,
}: GetColumnsParams): GridColDef<WorkTableRow>[] {
  const columns: GridColDef<WorkTableRow>[] = [
    {
      field: 'objectName',
      headerName: 'Kohde',
      width: 220,
      renderCell: (params: GridRenderCellParams<WorkTableRow>) => (
        <MaybeModifiedCell params={params} modifiedFields={modifiedFields}>
          <div
            css={css`
              display: flex;
              align-items: center;
              gap: 4px;
            `}
          >
            <Link
              to={`/investointihanke/${params.row.projectLink.projectId}/kohde/${params.row.id}`}
              target="_blank"
            >
              <Launch fontSize={'small'} htmlColor="#aaa" />
            </Link>
            <b>{params.value}</b>
          </div>
        </MaybeModifiedCell>
      ),
      renderEditCell: (params: GridRenderEditCellParams) => {
        return (
          <ProjectObjectNameEdit
            value={params.value}
            onChange={(newValue) => {
              params.api.setEditCellValue({
                id: params.id,
                field: params.field,
                value: newValue,
              });

              params.api.stopCellEditMode({
                id: params.id,
                field: params.field,
              });
            }}
          />
        );
      },
    },

    {
      field: 'lifecycleState',
      headerName: 'Tila',
      renderCell: (params: GridRenderCellParams) => (
        <MaybeModifiedCell params={params} modifiedFields={modifiedFields}>
          <CodeSpan codeListId={'KohteenElinkaarentila'} value={params.value} />
        </MaybeModifiedCell>
      ),
      renderEditCell: (params: GridRenderEditCellParams) => {
        const { id, field, value } = params;
        return (
          <TableCodeSelect
            codeListId="KohteenElinkaarentila"
            value={value}
            onChange={(newValue) => {
              params.api.setEditCellValue({ id, field, value: newValue });
              params.api.stopCellEditMode({ id, field, cellToFocusAfter: 'right' });
            }}
            onCancel={() => params.api.stopCellEditMode({ id, field })}
          />
        );
      },
    },
    {
      field: 'dateRange',
      headerName: 'Toteutusväli',
      width: 90,
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
        <div
          css={(theme) => css`
            display: flex;
            align-items: center;
            gap: ${theme.spacing(1)};
            justify-content: space-between;
          `}
        >
          <Launch fontSize={'small'} htmlColor="#aaa" />
          <Link
            to={`/investointihanke/${params.value.projectId}`}
            target="_blank"
            rel="noopener noreferrer"
            css={css`
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
            {params.value.projectName}
          </Link>
        </div>
      ),
    },
    {
      field: 'objectType',
      headerName: 'Tyyppi',
      width: 160,
      renderCell: (params: GridRenderCellParams) => (
        <CodeSpanMulti codeListId={'KohdeTyyppi'} value={params.value} />
      ),
      renderEditCell(params: GridRenderEditCellParams) {
        const { id, field, value } = params;
        return (
          <TableCodeCheckbox
            codeListId={'KohdeTyyppi'}
            value={value}
            onChange={(newValue) => {
              params.api.setEditCellValue({ id, field, value: newValue });
              params.api.stopCellEditMode({ id, field });
            }}
            onCancel={() => params.api.stopCellEditMode({ id, field })}
          />
        );
      },
    },
    {
      field: 'objectCategory',
      headerName: 'Omaisuusluokka',
      width: 160,
      renderCell: (params: GridRenderCellParams) => (
        <CodeSpanMulti codeListId={'KohteenOmaisuusLuokka'} value={params.value} />
      ),
      renderEditCell(params: GridRenderEditCellParams) {
        const { id, field, value } = params;
        return (
          <TableCodeCheckbox
            codeListId={'KohteenOmaisuusLuokka'}
            value={value}
            onChange={(newValue) => {
              params.api.setEditCellValue({ id, field, value: newValue });
              params.api.stopCellEditMode({ id, field });
            }}
            onCancel={() => params.api.stopCellEditMode({ id, field })}
          />
        );
      },
    },
    {
      field: 'objectUsage',
      headerName: 'Käyttötarkoitus',
      width: 172,
      renderCell: (params: GridRenderCellParams) => (
        <CodeSpanMulti codeListId={'KohteenToiminnallinenKayttoTarkoitus'} value={params.value} />
      ),
      renderEditCell(params: GridRenderEditCellParams) {
        const { id, field, value } = params;
        return (
          <TableCodeCheckbox
            codeListId={'KohteenToiminnallinenKayttoTarkoitus'}
            value={value}
            onChange={(newValue) => {
              params.api.setEditCellValue({ id, field, value: newValue });
              params.api.stopCellEditMode({ id, field });
            }}
            onCancel={() => params.api.stopCellEditMode({ id, field })}
          />
        );
      },
    },
    {
      field: 'operatives',
      headerName: 'Rakennuttaja / Suunnitteluttaja',
      width: 144,
      renderCell: ({ value }: GridRenderCellParams) => <ProjectObjectUsers value={value} />,
      renderEditCell: (params: GridRenderEditCellParams) => {
        const { id, field, value } = params;
        return (
          <ProjectObjectUserEdit
            value={value}
            onChange={(newValue) => params.api.setEditCellValue({ id, field, value: newValue })}
          />
        );
      },
    },
    {
      field: 'finances',
      headerName: 'Talousarvio / Toteuma',
      editable: financesRange !== 'allYears',
      flex: 1,
      renderCell: ({ row, value }: GridRenderCellParams) => {
        const startYear = dayjs(row.dateRange.startDate).year();
        const endYear = dayjs(row.dateRange.endDate).year();
        const notInRange =
          financesRange !== 'allYears' && (financesRange < startYear || financesRange > endYear);

        return (
          <Finances
            value={value}
            notInRange={notInRange}
            readOnly={isFinanceEditingDisabled(row, financesRange)}
          />
        );
      },
      renderEditCell: (params: GridRenderEditCellParams) => {
        const { id, field, value, api } = params;

        // NOTE: this is a workaround for not being able to disable editing for a single cell
        // based on the business logic.
        const isDisabled = isFinanceEditingDisabled(params.row, financesRange);
        if (isDisabled) {
          api.stopCellEditMode({ id: params.id, field: params.field });
          return <span></span>;
        }

        return (
          <CurrencyEdit
            value={value.budget}
            commitValue={(newValue) => {
              params.api.setEditCellValue({ id, field, value: { ...value, budget: newValue } });
              params.api.stopCellEditMode({ id, field });
            }}
          />
        );
      },
    },
  ];

  // Set common fields and wrap cell render to MaybeModifiedCell to avoid repetition
  columns.forEach((column) => {
    const oldRenderCell = column.renderCell;
    column.editable = column.editable !== false;
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
