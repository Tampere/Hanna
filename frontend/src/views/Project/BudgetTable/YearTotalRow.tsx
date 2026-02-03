import { ChevronRight } from '@mui/icons-material';
import { IconButton, Skeleton, TableCell, TableRow, css } from '@mui/material';
import { Ref } from 'react';

import { CurrencyInput } from '@frontend/components/forms/CurrencyInput';
import { SapActualsIcon } from '@frontend/components/icons/SapActuals';

import { ProjectYearBudget } from '@shared/schema/project';

import { BudgetField, BudgetFormValues, TABLE_CELL_CONTENT_CLASS } from '.';

export function getValueTextColor(value: number | null) {
  return value && value < 0 ? 'red' : 'inherit';
}

interface Props {
  fields: BudgetField[];
  formValues: BudgetFormValues;
  selectedCommittees: string[];
  year: number;
  sapActual: number | null;
  actual: number | null;
  actualsLoading: boolean;
  onHideYear?: () => void;
  isHidden?: boolean;
  /**
   * Optional custom aggregator for budget fields.
   * If provided, it is used instead of the default committee-based sum.
   */
  getFieldValue?: (
    fieldName: keyof ProjectYearBudget['budgetItems'],
    formValues: BudgetFormValues,
    year: number,
  ) => number;
  rowRef?: Ref<HTMLTableRowElement>;
}

export function YearTotalRow({
  fields,
  formValues,
  year,
  sapActual,
  actualsLoading,
  actual,
  selectedCommittees,
  getFieldValue,
  onHideYear,
  isHidden,
  rowRef,
}: Props) {
  function defaultGetFieldValue(fieldName: keyof ProjectYearBudget['budgetItems']) {
    if (!formValues || !formValues[year]) return 0;

    return Object.entries(formValues[year]).reduce((total, [committeeId, budgetItems]) => {
      if (selectedCommittees.includes(committeeId)) {
        return (total || 0) + (budgetItems?.[fieldName] ?? 0);
      }
      return total || 0;
    }, 0);
  }

  const effectiveGetFieldValue = (fieldName: keyof ProjectYearBudget['budgetItems']) =>
    getFieldValue ? getFieldValue(fieldName, formValues, year) : defaultGetFieldValue(fieldName);

  return (
    <TableRow
      ref={rowRef}
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
        colSpan={1}
        css={css`
          font-weight: 700;
          &.MuiTableCell-root {
            text-align: left;
          }
        `}
      >
        {onHideYear && (
          <IconButton
            size="small"
            onClick={onHideYear}
            sx={{
              transform: isHidden ? 'rotate(0deg)' : 'rotate(90deg)',
              transition: 'transform 0.25s ease-in-out',
            }}
          >
            <ChevronRight />
          </IconButton>
        )}
        {year}
      </TableCell>
      {fields?.includes('estimate') && (
        <TableCell>
          <CurrencyInput value={effectiveGetFieldValue('estimate')} />
        </TableCell>
      )}
      {fields?.includes('amount') && (
        <TableCell>
          <CurrencyInput value={effectiveGetFieldValue('amount')} />
        </TableCell>
      )}
      {fields?.includes('contractPrice') && (
        <TableCell>
          <CurrencyInput value={effectiveGetFieldValue('contractPrice')} />
        </TableCell>
      )}
      {fields?.includes('actual') && (
        <TableCell>
          {!actualsLoading ? (
            <span className={TABLE_CELL_CONTENT_CLASS}>
              <CurrencyInput
                allowNegative
                value={actual}
                placeholder={actual == null ? '–' : undefined}
              />
              {sapActual != null && <SapActualsIcon sapActual={sapActual}></SapActualsIcon>}
            </span>
          ) : (
            <Skeleton variant="rectangular" animation="wave">
              <CurrencyInput value={actual} />
            </Skeleton>
          )}
        </TableCell>
      )}
      {fields?.includes('forecast') && (
        <TableCell>
          <CurrencyInput allowNegative value={effectiveGetFieldValue('forecast')} />
        </TableCell>
      )}
      {fields?.includes('kayttosuunnitelmanMuutos') && (
        <TableCell style={{ textAlign: 'right' }}>
          <CurrencyInput
            style={{ minWidth: 220 }}
            getColor={getValueTextColor}
            value={effectiveGetFieldValue('kayttosuunnitelmanMuutos')}
          />
        </TableCell>
      )}
      <TableCell />
    </TableRow>
  );
}
