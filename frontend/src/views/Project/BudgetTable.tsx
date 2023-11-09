import { Save, Undo } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  css,
} from '@mui/material';
import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { FormField } from '@frontend/components/forms';
import { CurrencyInput } from '@frontend/components/forms/CurrencyInput';
import { useTranslations } from '@frontend/stores/lang';

import { YearBudget } from '@shared/schema/project';
import { YearlyActuals } from '@shared/schema/sapActuals';

type BudgetFields = 'amount' | 'forecast' | 'kayttosuunnitelmanMuutos';
interface Props {
  years: number[];
  budget: readonly YearBudget[];
  onSave: (budget: YearBudget[]) => Promise<void>;
  actuals?: YearlyActuals | null;
  actualsLoading?: boolean;
  writableFields?: BudgetFields[];
}

type BudgetFormValues = Record<string, YearBudget['budgetItems']>;

function budgetToFormValues(budget: YearBudget[], projectYears: number[]) {
  const values: BudgetFormValues = {};
  for (const year of projectYears) {
    const yearBudget = budget.find((b) => b.year === year);
    values[year] = yearBudget?.budgetItems ?? {
      amount: null,
      forecast: null,
      kayttosuunnitelmanMuutos: null,
    };
  }
  return values;
}

function formValuesToBudget(values: BudgetFormValues, projectYears: number[]): YearBudget[] {
  const budget: YearBudget[] = [];
  for (const year of projectYears) {
    budget.push({
      year,
      budgetItems: values[year],
    });
  }
  return budget;
}

const cellMinWidthStyle = css`
  text-align: right;
`;

export function BudgetTable(props: Props) {
  const { years, budget, onSave } = props;

  const tr = useTranslations();
  const form = useForm<BudgetFormValues>({ mode: 'all', defaultValues: {} });
  const watch = form.watch();

  /**
   * Convert budget from object into a simple array for the form
   */
  useEffect(() => {
    if (!budget) {
      return;
    }
    // Fill in all the years within the project's range
    form.reset(budgetToFormValues([...budget], years));
  }, [budget, years]);

  async function onSubmit(data: BudgetFormValues) {
    await onSave(formValuesToBudget(data, years));
    form.reset();
  }

  return !budget ? null : (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <Typography variant="overline">{tr('budgetTable.year')}</Typography>
                </TableCell>
                <TableCell css={cellMinWidthStyle}>
                  <Typography variant="overline"> {tr('budgetTable.budget')}</Typography>
                </TableCell>
                <TableCell css={cellMinWidthStyle}>
                  <Typography variant="overline">{tr('budgetTable.actual')}</Typography>
                  {props.actualsLoading && <CircularProgress sx={{ ml: 1 }} size={16} />}
                </TableCell>
                <TableCell css={cellMinWidthStyle}>
                  <Typography variant="overline">{tr('budgetTable.forecast')}</Typography>
                </TableCell>
                <TableCell css={cellMinWidthStyle}>
                  <Typography variant="overline">
                    {tr('budgetTable.kayttosuunnitelmanMuutos')}
                  </Typography>
                </TableCell>
                <TableCell sx={{ width: '100%' }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {years?.map((year) => (
                <TableRow key={year}>
                  <TableCell>{year}</TableCell>
                  <TableCell>
                    <FormField
                      formField={`${String(year)}.amount`}
                      component={({ ref, onChange, ...field }) => (
                        <CurrencyInput
                          {...field}
                          onChange={props.writableFields?.includes('amount') ? onChange : undefined}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    {!props.actualsLoading ? (
                      <CurrencyInput
                        value={props.actuals?.find((data) => data.year === year)?.total ?? null}
                      />
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <FormField
                      formField={`${String(year)}.forecast`}
                      component={({ ref, onChange, ...field }) => (
                        <CurrencyInput
                          {...field}
                          allowNegative
                          onChange={
                            props.writableFields?.includes('forecast') ? onChange : undefined
                          }
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      formField={`${String(year)}.kayttosuunnitelmanMuutos`}
                      component={({ ref, onChange, ...field }) => (
                        <CurrencyInput
                          {...field}
                          onChange={
                            props.writableFields?.includes('kayttosuunnitelmanMuutos')
                              ? onChange
                              : undefined
                          }
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell />
                </TableRow>
              ))}
              <TableRow>
                <TableCell>
                  <Typography variant="overline">{tr('budgetTable.total')}</Typography>
                </TableCell>
                <TableCell>
                  <CurrencyInput
                    value={
                      watch &&
                      Object.values(watch).reduce((total, budgetItem) => {
                        return (total || 0) + (budgetItem.amount ?? 0);
                      }, 0)
                    }
                  />
                </TableCell>
                <TableCell>
                  {!props.actualsLoading ? (
                    <CurrencyInput
                      value={
                        props.actuals?.reduce((total, yearData) => {
                          return total + yearData.total;
                        }, 0) ?? null
                      }
                    />
                  ) : null}
                </TableCell>
                <TableCell>
                  <CurrencyInput
                    value={
                      watch &&
                      Object.values(watch).reduce((total, budgetItem) => {
                        return (total || 0) + (budgetItem.forecast ?? 0);
                      }, 0)
                    }
                  />
                </TableCell>
                <TableCell>
                  <CurrencyInput
                    value={
                      watch &&
                      Object.values(watch).reduce((total, budgetItem) => {
                        return (total || 0) + (budgetItem.kayttosuunnitelmanMuutos ?? 0);
                      }, 0)
                    }
                  />
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        <Box
          css={css`
            display: flex;
            justify-content: flex-start;
            grid-gap: 8px;
            margin-top: 16px;
          `}
        >
          <Button
            size="small"
            type="reset"
            variant="outlined"
            sx={{ mt: 2, float: 'right' }}
            disabled={!form.formState.isDirty}
            onClick={() => form.reset()}
            endIcon={<Undo />}
          >
            {tr('genericForm.cancelAll')}
          </Button>
          <Button
            size="small"
            type="submit"
            variant="contained"
            sx={{ mt: 2, float: 'right' }}
            disabled={!form.formState.isDirty}
            endIcon={<Save />}
          >
            {tr('projectForm.saveBtnLabel')}
          </Button>
        </Box>
      </form>
    </FormProvider>
  );
}
