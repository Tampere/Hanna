import { Save, Undo } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Skeleton,
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
import { CurrencyInput, valueTextColor } from '@frontend/components/forms/CurrencyInput';
import { useTranslations } from '@frontend/stores/lang';

import { YearBudget } from '@shared/schema/project';
import { YearlyActuals } from '@shared/schema/sapActuals';

export type BudgetFields = 'amount' | 'forecast' | 'kayttosuunnitelmanMuutos' | 'actual';
interface Props {
  years: number[];
  budget: readonly YearBudget[];
  onSave: (budget: YearBudget[]) => Promise<void>;
  actuals?: YearlyActuals | null;
  actualsLoading?: boolean;
  writableFields?: BudgetFields[];
  fields?: BudgetFields[];
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

const cellStyle = css`
  max-width: 128px;
  text-align: right;
`;

export function BudgetTable(props: Props) {
  const { years, budget, onSave, writableFields } = {
    ...props,
  };

  const { fields = ['amount', 'forecast', 'kayttosuunnitelmanMuutos', 'actual'] } = {
    ...props,
  };

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
                {fields?.includes('amount') && (
                  <TableCell css={cellStyle}>
                    <Typography variant="overline"> {tr('budgetTable.budget')}</Typography>
                  </TableCell>
                )}
                {fields?.includes('actual') && (
                  <TableCell css={cellStyle}>
                    {props.actualsLoading && <CircularProgress size={10} sx={{ mr: 1 }} />}
                    <Typography variant="overline">{tr('budgetTable.actual')}</Typography>
                  </TableCell>
                )}
                {fields?.includes('forecast') && (
                  <TableCell css={cellStyle}>
                    <Typography variant="overline">{tr('budgetTable.forecast')}</Typography>
                  </TableCell>
                )}
                {fields?.includes('kayttosuunnitelmanMuutos') && (
                  <TableCell
                    css={css`
                      min-width: 256px;
                      text-align: right;
                    `}
                  >
                    <Typography variant="overline">
                      {tr('budgetTable.kayttosuunnitelmanMuutos')}
                    </Typography>
                  </TableCell>
                )}
                <TableCell sx={{ width: '100%' }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {years?.map((year) => (
                <TableRow key={year}>
                  <TableCell>{year}</TableCell>
                  {fields?.includes('amount') && (
                    <TableCell>
                      <FormField
                        formField={`${String(year)}.amount`}
                        component={({ ref, onChange, ...field }) => (
                          <CurrencyInput
                            {...field}
                            onChange={writableFields?.includes('amount') ? onChange : undefined}
                          />
                        )}
                      />
                    </TableCell>
                  )}
                  {fields?.includes('actual') && (
                    <TableCell>
                      {!props.actualsLoading ? (
                        <CurrencyInput
                          value={props.actuals?.find((data) => data.year === year)?.total ?? null}
                        />
                      ) : (
                        <Skeleton variant="rectangular" width={144} height={32} animation="wave" />
                      )}
                    </TableCell>
                  )}
                  {fields?.includes('forecast') && (
                    <TableCell>
                      <FormField
                        formField={`${String(year)}.forecast`}
                        component={({ ref, onChange, ...field }) => (
                          <CurrencyInput
                            {...field}
                            allowNegative
                            getColor={valueTextColor}
                            onChange={writableFields?.includes('forecast') ? onChange : undefined}
                          />
                        )}
                      />
                    </TableCell>
                  )}
                  {fields?.includes('kayttosuunnitelmanMuutos') && (
                    <TableCell style={{ textAlign: 'right' }}>
                      <FormField
                        formField={`${String(year)}.kayttosuunnitelmanMuutos`}
                        component={({ ref, onChange, ...field }) => (
                          <CurrencyInput
                            style={{ width: '100%', minWidth: 220 }}
                            getColor={valueTextColor}
                            {...field}
                            onChange={
                              writableFields?.includes('kayttosuunnitelmanMuutos')
                                ? onChange
                                : undefined
                            }
                          />
                        )}
                      />
                    </TableCell>
                  )}
                  <TableCell />
                </TableRow>
              ))}
              <TableRow>
                <TableCell>
                  <Typography variant="overline">{tr('budgetTable.total')}</Typography>
                </TableCell>
                {fields?.includes('amount') && (
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
                )}
                {fields?.includes('actual') && (
                  <TableCell>
                    {!props.actualsLoading ? (
                      <CurrencyInput
                        value={
                          props.actuals?.reduce((total, yearData) => {
                            return total + yearData.total;
                          }, 0) ?? 0
                        }
                      />
                    ) : (
                      <Skeleton variant="rectangular" width={144} height={32} animation="wave" />
                    )}
                  </TableCell>
                )}
                {fields?.includes('forecast') && (
                  <TableCell>
                    <CurrencyInput
                      getColor={valueTextColor}
                      value={
                        watch &&
                        Object.values(watch).reduce((total, budgetItem) => {
                          return (total || 0) + (budgetItem.forecast ?? 0);
                        }, 0)
                      }
                    />
                  </TableCell>
                )}
                {fields?.includes('kayttosuunnitelmanMuutos') && (
                  <TableCell style={{ textAlign: 'right' }}>
                    <CurrencyInput
                      style={{ minWidth: 220 }}
                      getColor={valueTextColor}
                      value={
                        watch &&
                        Object.values(watch).reduce((total, budgetItem) => {
                          return (total || 0) + (budgetItem.kayttosuunnitelmanMuutos ?? 0);
                        }, 0)
                      }
                    />
                  </TableCell>
                )}
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
