import { Skeleton, TableCell, TableRow, Typography, css } from '@mui/material';

import { FormField } from '@frontend/components/forms';
import { CurrencyInput, valueTextColor } from '@frontend/components/forms/CurrencyInput';
import { SapActualsIcon } from '@frontend/components/icons/SapActuals';

import { Code } from '@shared/schema/code';
import { CommonDbProjectObject } from '@shared/schema/projectObject/base';
import { YearlyActuals } from '@shared/schema/sapActuals';

import { BudgetField, TABLE_CELL_CONTENT_CLASS } from '.';
import { committeeColors } from './CommitteeSelection';

interface BudgetContentRowCellProps {
  projectObject: CommonDbProjectObject;
  fields?: BudgetField[];
  year: number;
  writableFields?: BudgetField[];
  actualsLoading?: boolean;
  actuals?: YearlyActuals | null;
  disableBorder?: boolean;
}

export function ProjectObjectBudgetRow({
  projectObject,
  fields,
  year,
  writableFields,
  actualsLoading,
  actuals,
  disableBorder,
}: BudgetContentRowCellProps) {
  const committeeColor =
    committeeColors[(projectObject.objectCommittee as keyof typeof committeeColors) ?? 'default'];

  /** Form field identifier determines how the form data is structured.
   * We namespace project object fields under projectObjects.{projectObjectId}.{year}.{field}
   * to avoid collisions with the main project budget fields.
   */
  function getFormFieldIdentifier(year: number, field: BudgetField) {
    return `projectObjects.${projectObject.projectObjectId}.${String(year)}.${field}`;
  }
  console.log('projectObject', projectObject, writableFields);
  return (
    <TableRow
      css={css`
        min-height: 50px;
        ${true ? 'td {border-bottom: none;}' : ''}
      `}
    >
      {
        <TableCell
          css={css`
            font-weight: 700;
            width: 550px;
            &.MuiTableCell-root {
              text-align: left;
            }
          `}
        >
          {projectObject.objectName ?? '–'}
        </TableCell>
      }

      {fields?.includes('estimate') && (
        <TableCell>
          <FormField
            className={TABLE_CELL_CONTENT_CLASS}
            formField={getFormFieldIdentifier(year, 'estimate')}
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            component={({ ref, onChange, ...field }) => (
              <CurrencyInput
                placeholder="–"
                directlyHandleValueChange
                {...field}
                onChange={writableFields?.includes('estimate') ? onChange : undefined}
                style={() => {
                  return committeeColor;
                }}
              />
            )}
          />
        </TableCell>
      )}
      {fields?.includes('amount') && (
        <TableCell>
          <FormField
            className={TABLE_CELL_CONTENT_CLASS}
            formField={getFormFieldIdentifier(year, 'amount')}
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            component={({ ref, onChange, ...field }) => (
              <CurrencyInput
                placeholder="–"
                directlyHandleValueChange
                {...field}
                getColor={() => {
                  return committeeColor;
                }}
                onChange={writableFields?.includes('amount') ? onChange : undefined}
                style={() => {
                  return committeeColor;
                }}
              />
            )}
          />
        </TableCell>
      )}
      {fields?.includes('contractPrice') && (
        <TableCell>
          <FormField
            className={TABLE_CELL_CONTENT_CLASS}
            formField={getFormFieldIdentifier(year, 'contractPrice')}
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            component={({ ref, onChange, ...field }) => (
              <CurrencyInput
                placeholder="–"
                getColor={() => {
                  return committeeColor;
                }}
                directlyHandleValueChange
                {...field}
                onChange={writableFields?.includes('contractPrice') ? onChange : undefined}
                style={() => {
                  return committeeColor;
                }}
              />
            )}
          />
        </TableCell>
      )}

      {fields?.includes('actual') ? (
        <TableCell>
          {!actualsLoading ? (
            <span className={TABLE_CELL_CONTENT_CLASS}>
              <>
                <CurrencyInput
                  getColor={() => {
                    return committeeColor;
                  }}
                  directlyHandleValueChange
                  value={(true ? actuals?.find((data) => data.year === year)?.total : null) ?? null}
                  placeholder={'–'}
                />
              </>
            </span>
          ) : (
            <Skeleton variant="rectangular" animation="wave">
              <span className={TABLE_CELL_CONTENT_CLASS}>
                <CurrencyInput value={actuals?.find((data) => data.year === year)?.total ?? null} />
              </span>
            </Skeleton>
          )}
        </TableCell>
      ) : (
        <TableCell />
      )}
      {fields?.includes('forecast') && (
        <TableCell>
          <FormField
            className={TABLE_CELL_CONTENT_CLASS}
            formField={getFormFieldIdentifier(year, 'forecast')}
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            component={({ ref, onChange, ...field }) => (
              <CurrencyInput
                placeholder="–"
                directlyHandleValueChange
                {...field}
                allowNegative
                style={{ committeeColor }}
                getColor={(val) => {
                  if (fields.includes('committee') && (field.value >= 0 || !field.value)) {
                    return committeeColor;
                  }

                  return valueTextColor(val);
                }}
                onChange={writableFields?.includes('forecast') ? onChange : undefined}
              />
            )}
          />
        </TableCell>
      )}
      {fields?.includes('kayttosuunnitelmanMuutos') && (
        <TableCell style={{ textAlign: 'right' }}>
          <FormField
            className={TABLE_CELL_CONTENT_CLASS}
            formField={getFormFieldIdentifier(year, 'kayttosuunnitelmanMuutos')}
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            component={({ ref, onChange, ...field }) => (
              <CurrencyInput
                placeholder="–"
                directlyHandleValueChange
                allowNegative
                style={{
                  width: '100%',
                  minWidth: 220,
                  color: committeeColor,
                }}
                getColor={(val) => {
                  return committeeColor;
                }}
                {...field}
                onChange={
                  writableFields?.includes('kayttosuunnitelmanMuutos') ? onChange : undefined
                }
              />
            )}
          />
        </TableCell>
      )}
    </TableRow>
  );
}
