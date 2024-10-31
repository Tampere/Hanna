import {
  Box,
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
import { useSetAtom } from 'jotai';
import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { HelpTooltip } from '@frontend/components/HelpTooltip';
import { FormField } from '@frontend/components/forms';
import { CurrencyInput, valueTextColor } from '@frontend/components/forms/CurrencyInput';
import { useTranslations } from '@frontend/stores/lang';
import { useNavigationBlocker } from '@frontend/stores/navigationBlocker';
import { dirtyAndValidFieldsAtom } from '@frontend/stores/projectView';

import { ProjectYearBudget } from '@shared/schema/project';
import { YearlyActuals } from '@shared/schema/sapActuals';

export type BudgetFields =
  | 'year'
  | 'estimate'
  | 'contractPrice'
  | 'amount'
  | 'forecast'
  | 'kayttosuunnitelmanMuutos'
  | 'actual';
interface Props {
  years: number[];
  budget: readonly ProjectYearBudget[];
  onSave: (budget: ProjectYearBudget[]) => Promise<void>;
  actuals?: YearlyActuals | null;
  actualsLoading?: boolean;
  writableFields?: BudgetFields[];
  fields?: BudgetFields[];
  enableTooltips?: boolean;
  customTooltips?: Partial<Record<BudgetFields, string>>;
}

type BudgetFormValues = Record<string, ProjectYearBudget['budgetItems']>;

function budgetToFormValues<
  TBudget extends {
    year: number;
    budgetItems: ProjectYearBudget['budgetItems'];
  } = ProjectYearBudget,
>(budget: TBudget[], projectYears: number[]) {
  const values: BudgetFormValues = {};
  for (const year of projectYears) {
    const yearBudget = budget.find((b) => b.year === year);
    values[year] = yearBudget?.budgetItems ?? {
      amount: null,
      estimate: null,
      forecast: null,
      kayttosuunnitelmanMuutos: null,
      contractPrice: null,
    };
  }
  return values;
}

function formValuesToBudget(values: BudgetFormValues, projectYears: number[]): ProjectYearBudget[] {
  const budget: ProjectYearBudget[] = [];
  for (const year of projectYears) {
    if (values[year]) {
      budget.push({
        year,
        budgetItems: values[year],
      });
    }
  }

  return budget;
}

const cellStyle = css`
  max-width: 128px;
  text-align: right;
`;

export const BudgetTable = forwardRef(function BudgetTable(props: Props, ref) {
  const {
    years,
    budget,
    onSave,
    writableFields,
    enableTooltips = true,
  } = {
    ...props,
  };

  const { fields = ['estimate', 'amount', 'forecast', 'kayttosuunnitelmanMuutos', 'actual'] } = {
    ...props,
  };

  const tr = useTranslations();
  const form = useForm<BudgetFormValues>({ mode: 'all', defaultValues: {} });
  const { isDirty, dirtyFields } = form.formState;
  const setDirtyAndValidViews = useSetAtom(dirtyAndValidFieldsAtom);
  const watch = form.watch();
  useNavigationBlocker(isDirty, 'budgetTable', () => {
    setDirtyAndValidViews((prev) => ({ ...prev, finances: { isDirtyAndValid: false } }));
  });

  useImperativeHandle(
    ref,
    () => ({
      onSave: form.handleSubmit(async (data) => await onSubmit(data)),
      onCancel: form.reset,
    }),
    [dirtyFields, onSubmit],
  );

  function getDirtyValues(data: BudgetFormValues): BudgetFormValues {
    return Object.entries(dirtyFields).reduce<BudgetFormValues>(
      (dirtyValues, [year, dirtyFieldObject]) => {
        if (!dirtyFieldObject) {
          return dirtyValues;
        }
        const objectEntries = Object.entries(data[year]).filter(
          ([field]) => dirtyFieldObject[field as keyof typeof dirtyFieldObject],
        ) as [BudgetFields, BudgetFormValues[string]][];

        return {
          ...dirtyValues,
          [year]: Object.fromEntries<BudgetFormValues[string]>(objectEntries),
        };
      },
      {},
    );
  }

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

  useEffect(() => {
    setDirtyAndValidViews((prev) => {
      return {
        ...prev,
        finances: { isDirtyAndValid: isDirty },
      };
    });
  }, [isDirty]);

  async function onSubmit(data: BudgetFormValues) {
    await onSave(formValuesToBudget(getDirtyValues(data), years));
    form.reset();
  }

  return !budget ? null : (
    <>
      <FormProvider {...form}>
        <form
          css={css`
            & .MuiFormControl-root {
              margin: 0;
            }
          `}
          onSubmit={form.handleSubmit(onSubmit)}
          autoComplete="off"
        >
          <TableContainer>
            <Table size="small">
              <TableHead
                css={css`
                  & .column-header {
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                  }
                `}
              >
                <TableRow>
                  <TableCell>
                    <Box className="column-header">
                      <Typography variant="overline">{tr('budgetTable.year')}</Typography>
                      {enableTooltips && (
                        <HelpTooltip
                          title={props.customTooltips?.year ?? tr('budgetTable.yearHelp')}
                        />
                      )}
                    </Box>
                  </TableCell>

                  {fields?.includes('estimate') && (
                    <TableCell>
                      <Box className="column-header">
                        <Typography variant="overline">{tr('budgetTable.estimate')}</Typography>
                        {enableTooltips && (
                          <HelpTooltip
                            title={
                              props.customTooltips?.estimate ??
                              tr('budgetTable.projectEstimateHelp')
                            }
                          />
                        )}
                      </Box>{' '}
                    </TableCell>
                  )}

                  {fields?.includes('amount') && (
                    <TableCell css={cellStyle}>
                      <Box className="column-header">
                        <Typography variant="overline"> {tr('budgetTable.amount')}</Typography>
                        {enableTooltips && (
                          <HelpTooltip
                            title={props.customTooltips?.amount ?? tr('budgetTable.amountHelp')}
                          />
                        )}
                      </Box>
                    </TableCell>
                  )}
                  {fields?.includes('contractPrice') && (
                    <TableCell>
                      <Box className="column-header">
                        <Typography variant="overline">
                          {tr('budgetTable.contractPrice')}
                        </Typography>
                        {enableTooltips && (
                          <HelpTooltip
                            title={
                              props.customTooltips?.contractPrice ??
                              tr('budgetTable.contractPriceHelp')
                            }
                          />
                        )}
                      </Box>{' '}
                    </TableCell>
                  )}
                  {fields?.includes('actual') && (
                    <TableCell css={cellStyle}>
                      <Box className="column-header">
                        {props.actualsLoading && <CircularProgress size={10} sx={{ mr: 1 }} />}
                        <Typography variant="overline">{tr('budgetTable.actual')}</Typography>
                        {enableTooltips && (
                          <HelpTooltip
                            title={props.customTooltips?.actual ?? tr('budgetTable.actualHelp')}
                          />
                        )}
                      </Box>
                    </TableCell>
                  )}
                  {fields?.includes('forecast') && (
                    <TableCell css={cellStyle}>
                      <Box className="column-header">
                        <Typography variant="overline">{tr('budgetTable.forecast')}</Typography>
                        {enableTooltips && (
                          <HelpTooltip
                            title={props.customTooltips?.forecast ?? tr('budgetTable.forecastHelp')}
                          />
                        )}
                      </Box>
                    </TableCell>
                  )}
                  {fields?.includes('kayttosuunnitelmanMuutos') && (
                    <TableCell
                      css={css`
                        min-width: 280px;
                        text-align: right;
                      `}
                    >
                      <Box className="column-header">
                        <Typography variant="overline">
                          {tr('budgetTable.kayttosuunnitelmanMuutos')}
                        </Typography>
                        {enableTooltips && (
                          <HelpTooltip
                            title={
                              props.customTooltips?.kayttosuunnitelmanMuutos ??
                              tr('budgetTable.kayttosuunnitelmanMuutosHelp')
                            }
                          />
                        )}
                      </Box>
                    </TableCell>
                  )}
                  <TableCell sx={{ width: '100%' }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {years?.map((year) => (
                  <TableRow key={year}>
                    <TableCell>{year}</TableCell>

                    {fields?.includes('estimate') && (
                      <TableCell>
                        <FormField
                          formField={`${String(year)}.estimate`}
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          component={({ ref, onChange, ...field }) => (
                            <CurrencyInput
                              directlyHandleValueChange
                              {...field}
                              onChange={writableFields?.includes('estimate') ? onChange : undefined}
                            />
                          )}
                        />
                      </TableCell>
                    )}
                    {fields?.includes('amount') && (
                      <TableCell>
                        <FormField
                          formField={`${String(year)}.amount`}
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          component={({ ref, onChange, ...field }) => (
                            <CurrencyInput
                              directlyHandleValueChange
                              {...field}
                              onChange={writableFields?.includes('amount') ? onChange : undefined}
                            />
                          )}
                        />
                      </TableCell>
                    )}
                    {fields?.includes('contractPrice') && (
                      <TableCell>
                        <FormField
                          formField={`${String(year)}.contractPrice`}
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          component={({ ref, onChange, ...field }) => (
                            <CurrencyInput
                              directlyHandleValueChange
                              {...field}
                              onChange={
                                writableFields?.includes('contractPrice') ? onChange : undefined
                              }
                            />
                          )}
                        />
                      </TableCell>
                    )}

                    {fields?.includes('actual') && (
                      <TableCell>
                        {!props.actualsLoading ? (
                          <Box
                            css={css`
                              margin: 8px 4px;
                            `}
                          >
                            <CurrencyInput
                              directlyHandleValueChange
                              value={
                                props.actuals?.find((data) => data.year === year)?.total ?? null
                              }
                            />
                          </Box>
                        ) : (
                          <Skeleton
                            variant="rectangular"
                            width={144}
                            height={32}
                            animation="wave"
                          />
                        )}
                      </TableCell>
                    )}
                    {fields?.includes('forecast') && (
                      <TableCell>
                        <FormField
                          formField={`${String(year)}.forecast`}
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          component={({ ref, onChange, ...field }) => (
                            <CurrencyInput
                              directlyHandleValueChange
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
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          component={({ ref, onChange, ...field }) => (
                            <CurrencyInput
                              directlyHandleValueChange
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
                  {fields?.includes('estimate') && (
                    <TableCell>
                      <CurrencyInput
                        value={
                          watch &&
                          Object.values(watch).reduce((total, budgetItem) => {
                            return (total || 0) + (budgetItem.estimate ?? 0);
                          }, 0)
                        }
                      />
                    </TableCell>
                  )}
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
                  {fields?.includes('contractPrice') && (
                    <TableCell>
                      <CurrencyInput
                        value={
                          watch &&
                          Object.values(watch).reduce((total, budgetItem) => {
                            return (total || 0) + (budgetItem.contractPrice ?? 0);
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
        </form>
      </FormProvider>
    </>
  );
});
