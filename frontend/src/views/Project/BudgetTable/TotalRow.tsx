import { Skeleton, TableCell, TableRow, Typography, css } from '@mui/material';

import { CurrencyInput, valueTextColor } from '@frontend/components/forms/CurrencyInput';
import { useTranslations } from '@frontend/stores/lang';

import { ProjectYearBudget } from '@shared/schema/project';
import { YearlyActuals } from '@shared/schema/sapActuals';

import { BudgetField, BudgetFormValues, TABLE_CELL_CONTENT_CLASS } from '.';
import { getValueTextColor } from './YearTotalRow';

interface Props {
  fields: BudgetField[];
  actuals?: YearlyActuals | null;
  actualsLoading: boolean;
  formValues: BudgetFormValues;
  getFieldValue: (
    fieldName: keyof ProjectYearBudget['budgetItems'],
    formValues?: BudgetFormValues,
  ) => number | null;
}

export function TotalRow({ actuals, actualsLoading, fields, getFieldValue, formValues }: Props) {
  const tr = useTranslations();

  return (
    <TableRow
      css={css`
        input {
          min-height: 28px;
          flex: 1;
        }
      `}
    >
      <TableCell colSpan={fields.includes('committee') ? 2 : 1}>
        <Typography className={TABLE_CELL_CONTENT_CLASS} variant="overline">
          {tr('budgetTable.total')}
        </Typography>
      </TableCell>
      {fields?.includes('estimate') && (
        <TableCell>
          <CurrencyInput
            className={TABLE_CELL_CONTENT_CLASS}
            value={getFieldValue('estimate', formValues)}
          />
        </TableCell>
      )}
      {fields?.includes('amount') && (
        <TableCell>
          <CurrencyInput
            className={TABLE_CELL_CONTENT_CLASS}
            value={getFieldValue('amount', formValues)}
          />
        </TableCell>
      )}
      {fields?.includes('contractPrice') && (
        <TableCell>
          <CurrencyInput
            className={TABLE_CELL_CONTENT_CLASS}
            value={getFieldValue('contractPrice', formValues)}
          />
        </TableCell>
      )}
      {fields?.includes('actual') && (
        <TableCell>
          {!actualsLoading ? (
            <CurrencyInput
              className={TABLE_CELL_CONTENT_CLASS}
              allowNegative
              placeholder="–"
              value={
                actuals?.reduce((total, yearData) => {
                  return total + yearData.total;
                }, 0) ?? null
              }
            />
          ) : (
            <Skeleton variant="rectangular" animation="wave">
              <CurrencyInput
                className={TABLE_CELL_CONTENT_CLASS}
                value={
                  actuals?.reduce((total, yearData) => {
                    return total + yearData.total;
                  }, 0) ?? 0
                }
              />
            </Skeleton>
          )}
        </TableCell>
      )}
      {fields?.includes('forecast') && (
        <TableCell>
          <CurrencyInput
            allowNegative
            className={TABLE_CELL_CONTENT_CLASS}
            getColor={fields.includes('committee') ? getValueTextColor : valueTextColor}
            value={getFieldValue('forecast', formValues)}
          />
        </TableCell>
      )}
      {fields?.includes('kayttosuunnitelmanMuutos') && (
        <TableCell style={{ textAlign: 'right' }}>
          <span className={TABLE_CELL_CONTENT_CLASS}>
            <CurrencyInput
              style={{ minWidth: 220 }}
              getColor={fields.includes('committee') ? getValueTextColor : valueTextColor}
              value={getFieldValue('kayttosuunnitelmanMuutos', formValues)}
            />
          </span>
        </TableCell>
      )}
      <TableCell />
    </TableRow>
  );
}
