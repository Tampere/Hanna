import { Skeleton, TableCell, TableRow, css } from '@mui/material';
import { ProjectYearBudget } from 'tre-hanna-shared/src/schema/project';

import { CurrencyInput } from '@frontend/components/forms/CurrencyInput';

import { BudgetField, BudgetFormValues } from '.';

export function getValueTextColor(value: number | null) {
  return value && value < 0 ? 'red' : 'inherit';
}

interface Props {
  fields: BudgetField[];
  formValues: BudgetFormValues;
  selectedCommittees: string[];
  year: number;
  actual: number | null;
  actualsLoading: boolean;
}

export function YearTotalRow({
  fields,
  formValues,
  year,
  actualsLoading,
  actual,
  selectedCommittees,
}: Props) {
  function getFieldValue(fieldName: keyof ProjectYearBudget['budgetItems']) {
    if (!formValues || !formValues[year]) return 0;

    return Object.entries(formValues[year]).reduce((total, [committeeId, budgetItems]) => {
      if (selectedCommittees.includes(committeeId)) {
        return (total || 0) + (budgetItems?.[fieldName] ?? 0);
      }
      return total || 0;
    }, 0);
  }

  return (
    <TableRow
      css={css`
        input {
          min-height: 28px;
          width: auto !important;
        }
        td {
          margin-top: 10px;
          border-bottom: none;
        }
      `}
    >
      <TableCell
        colSpan={2}
        css={css`
          font-weight: 700;
          &.MuiTableCell-root {
            text-align: left;
          }
        `}
      >
        {year}
      </TableCell>
      {fields?.includes('estimate') && (
        <TableCell>
          <CurrencyInput value={getFieldValue('estimate')} />
        </TableCell>
      )}
      {fields?.includes('amount') && (
        <TableCell>
          <CurrencyInput value={getFieldValue('amount')} />
        </TableCell>
      )}
      {fields?.includes('contractPrice') && (
        <TableCell>
          <CurrencyInput value={getFieldValue('contractPrice')} />
        </TableCell>
      )}
      {fields?.includes('actual') && (
        <TableCell>
          {!actualsLoading ? (
            <CurrencyInput
              allowNegative
              value={actual}
              placeholder={actual == null ? '0,00 €' : undefined}
            />
          ) : (
            <Skeleton variant="rectangular" animation="wave">
              <CurrencyInput value={actual} />
            </Skeleton>
          )}
        </TableCell>
      )}
      {fields?.includes('forecast') && (
        <TableCell>
          <CurrencyInput
            allowNegative
            getColor={getValueTextColor}
            value={getFieldValue('forecast')}
          />
        </TableCell>
      )}
      {fields?.includes('kayttosuunnitelmanMuutos') && (
        <TableCell style={{ textAlign: 'right' }}>
          <CurrencyInput
            style={{ minWidth: 220 }}
            getColor={getValueTextColor}
            value={getFieldValue('kayttosuunnitelmanMuutos')}
          />
        </TableCell>
      )}
      <TableCell />
    </TableRow>
  );
}
