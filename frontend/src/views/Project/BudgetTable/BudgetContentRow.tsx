import { Skeleton, TableCell, TableRow, Typography, css } from '@mui/material';



import { FormField } from '@frontend/components/forms';
import { CurrencyInput, valueTextColor } from '@frontend/components/forms/CurrencyInput';
import { SapActualsIcon } from '@frontend/components/icons/SapActuals';



import { Code } from '@shared/schema/code';
import { YearlyActuals } from '@shared/schema/sapActuals';



import { BudgetField, TABLE_CELL_CONTENT_CLASS } from '.';
import { committeeColors } from './CommitteeSelection';
interface BudgetContentRowCellProps {
  year: number;
  writableFields?: BudgetField[];
  fields?: BudgetField[];
  actualsLoading?: boolean;
  actuals?: YearlyActuals | null;
  committee?: { id: Code['id']['id']; text: string };
  includeYearColumn: boolean;
  disableBorder?: boolean;
  sapYearTotal?: number | null;
}

export function BudgetContentRow({
  year,
  writableFields,
  fields,
  actualsLoading,
  actuals,
  includeYearColumn,
  committee,
  disableBorder,
  sapYearTotal,
}: BudgetContentRowCellProps) {
  const committeeColor =
    committeeColors[(committee?.id as keyof typeof committeeColors) ?? 'default'];

  /** Form field identifier determines how to form data is structured.
   * For example year.committee.estimate represents an object {year: {committee: {estimate: value}}}.
   */
  function getFormFieldIdentifier(year: number, field: BudgetField, committeeId?: string) {
    // If there's no committee saved, the field represents total row for the year
    return `${String(year)}.${committeeId ?? 'total'}.${field}`;
  }
  return (
    <TableRow
      css={css`
        min-height: 50px;
        ${disableBorder ? 'td {border-bottom: none;}' : ''}
      `}
    >
      {includeYearColumn && (
        <TableCell
          css={css`
            font-weight: 700;
            &.MuiTableCell-root {
              text-align: left;
            }
          `}
        >
          {year}
        </TableCell>
      )}
      {fields?.includes('committee') && (
        <TableCell colSpan={includeYearColumn ? 1 : 2} align="right">
          <Typography
            className={TABLE_CELL_CONTENT_CLASS}
            css={css`
              font-size: 0.875rem;
              color: ${committeeColor};
            `}
          >
            {committee?.text}
          </Typography>
        </TableCell>
      )}
      {fields?.includes('estimate') && (
        <TableCell>
          <FormField
            className={TABLE_CELL_CONTENT_CLASS}
            formField={getFormFieldIdentifier(year, 'estimate', committee?.id)}
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            component={({ ref, onChange, ...field }) => (
              <CurrencyInput
                placeholder="–"
                directlyHandleValueChange
                {...field}
                onChange={writableFields?.includes('estimate') ? onChange : undefined}
                style={{ color: includeYearColumn ? 'inherit' : committeeColor }}
              />
            )}
          />
        </TableCell>
      )}
      {fields?.includes('amount') && (
        <TableCell>
          <FormField
            className={TABLE_CELL_CONTENT_CLASS}
            formField={getFormFieldIdentifier(year, 'amount', committee?.id)}
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            component={({ ref, onChange, ...field }) => (
              <CurrencyInput
                placeholder="–"
                directlyHandleValueChange
                {...field}
                getColor={() => {
                  if (!includeYearColumn && fields.includes('committee')) {
                    return committeeColor;
                  }
                  return 'inherit';
                }}
                onChange={writableFields?.includes('amount') ? onChange : undefined}
                style={{ color: includeYearColumn ? 'inherit' : committeeColor }}
              />
            )}
          />
        </TableCell>
      )}
      {fields?.includes('contractPrice') && (
        <TableCell>
          <FormField
            className={TABLE_CELL_CONTENT_CLASS}
            formField={getFormFieldIdentifier(year, 'contractPrice', committee?.id)}
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            component={({ ref, onChange, ...field }) => (
              <CurrencyInput
                placeholder="–"
                getColor={() => {
                  if (!includeYearColumn && fields.includes('contractPrice')) {
                    return committeeColor;
                  }
                  return 'inherit';
                }}
                directlyHandleValueChange
                {...field}
                onChange={writableFields?.includes('contractPrice') ? onChange : undefined}
                style={{ color: includeYearColumn ? 'inherit' : committeeColor }}
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
                    if (!includeYearColumn && fields.includes('committee')) {
                      return committeeColor;
                    }
                    return 'inherit';
                  }}
                  directlyHandleValueChange
                  value={(true ? actuals?.find((data) => data.year === year)?.total : null) ?? null}
                  placeholder={'–'}
                />

                {
                  !disableBorder &&
                    sapYearTotal != null && ( // Borders are disabled when there are multiple committees
                      <SapActualsIcon sapActual={sapYearTotal ?? 0}></SapActualsIcon>
                    ) // Sap actuals icon is shown only when there is only one committee
                }
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
            formField={getFormFieldIdentifier(year, 'forecast', committee?.id)}
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            component={({ ref, onChange, ...field }) => (
              <CurrencyInput
                placeholder="–"
                directlyHandleValueChange
                {...field}
                allowNegative
                style={{ color: includeYearColumn ? 'inherit' : committeeColor }}
                getColor={(val) => {
                  if (
                    !includeYearColumn &&
                    fields.includes('committee') &&
                    (field.value >= 0 || !field.value)
                  ) {
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
            formField={getFormFieldIdentifier(year, 'kayttosuunnitelmanMuutos', committee?.id)}
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            component={({ ref, onChange, ...field }) => (
              <CurrencyInput
                placeholder="–"
                directlyHandleValueChange
                allowNegative
                style={{
                  width: '100%',
                  minWidth: 220,
                  color: includeYearColumn ? 'inherit' : committeeColor,
                }}
                getColor={(val) => {
                  if (!includeYearColumn && fields.includes('committee')) {
                    return committeeColor;
                  }
                  return valueTextColor(val);
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
