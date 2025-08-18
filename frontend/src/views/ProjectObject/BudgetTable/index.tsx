import {
  Box,
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
import { useSetAtom } from 'jotai';
import { Fragment, forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { HelpTooltip } from '@frontend/components/HelpTooltip';
import { useTranslations } from '@frontend/stores/lang';
import { useNavigationBlocker } from '@frontend/stores/navigationBlocker';
import { dirtyAndValidFieldsAtom } from '@frontend/stores/projectView';
import { BudgetContentRow } from '@frontend/views/Project/BudgetTable/BudgetContentRow';
import { TotalRow } from '@frontend/views/Project/BudgetTable/TotalRow';

import { ProjectYearBudget } from '@shared/schema/project';
import { YearlyActuals } from '@shared/schema/sapActuals';

export const TABLE_CELL_CONTENT_CLASS = 'table-cell-content';

export type BudgetField =
  | 'year'
  | 'committee'
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
  actuals?: YearlyActuals;
  actualsLoading?: boolean;
  writableFields?: BudgetField[];
  fields?: BudgetField[];
  enableTooltips?: boolean;
  customTooltips?: Partial<Record<BudgetField, string>>;
}

export type BudgetFormValues = Record<string, Record<string, ProjectYearBudget['budgetItems']>>;

function getFieldTotalValueByYear(
  fieldName: keyof ProjectYearBudget['budgetItems'],
  formValues?: BudgetFormValues,
) {
  if (!formValues) return null;
  return Object.values(formValues).reduce((total, budgetItem) => {
    return (total || 0) + ((budgetItem['total'] && budgetItem['total'][fieldName]) ?? 0);
  }, 0);
}

function isNullish(value?: number | null) {
  return value === null || value === undefined;
}

function budgetToFormValues<
  TBudget extends {
    year: number;
    budgetItems: ProjectYearBudget['budgetItems'];
    committee: ProjectYearBudget['committee'];
  } = ProjectYearBudget,
>(budget: TBudget[], projectYears: number[], committees?: string[]) {
  const values: BudgetFormValues = {};

  for (const year of projectYears) {
    const yearlyBudgets = budget.filter((b) => b.year === year);

    values[year] = {};
    for (const committee of committees && committees.length > 0 ? committees : ['total']) {
      values[year][committee] = yearlyBudgets.reduce<BudgetFormValues[string][string]>(
        (budgetItems, item) => {
          const { estimate, amount, forecast, contractPrice, kayttosuunnitelmanMuutos } =
            item.budgetItems;
          if (committee !== 'total' && item.committee !== committee) {
            return budgetItems;
          }

          return {
            ...budgetItems,
            ...(!isNullish(estimate) && {
              estimate: (budgetItems.estimate ?? 0) + estimate,
            }),
            ...(!isNullish(amount) && { amount: (budgetItems.amount ?? 0) + amount }),
            ...(!isNullish(forecast) && { forecast: (budgetItems.forecast ?? 0) + forecast }),
            ...(!isNullish(contractPrice) && {
              contractPrice: (budgetItems.contractPrice ?? 0) + contractPrice,
            }),
            ...(!isNullish(kayttosuunnitelmanMuutos) && {
              kayttosuunnitelmanMuutos:
                (budgetItems.kayttosuunnitelmanMuutos ?? 0) + kayttosuunnitelmanMuutos,
            }),
          };
        },
        {
          estimate: null,
          amount: null,
          forecast: null,
          contractPrice: null,
          kayttosuunnitelmanMuutos: null,
        }, // These initial values need to be set to allow form to infer dirty fields correctly
      );
    }
  }

  return values;
}

function formValuesToBudget(values: BudgetFormValues, projectYears: number[]): ProjectYearBudget[] {
  const budget: ProjectYearBudget[] = [];
  for (const year of projectYears) {
    if (values[year]) {
      Object.entries(values[year]).forEach(([committeeIdentifier, budgetItems]) => {
        budget.push({
          year,
          budgetItems: budgetItems,
          committee: committeeIdentifier === 'total' ? null : committeeIdentifier,
        });
      });
    }
  }

  return budget;
}

const cellStyle = css`
  min-width: 128px;
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
  useNavigationBlocker(Object.keys(dirtyFields).length > 0, 'budgetTable', () => {
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
        // Get only dirty fields for submission since the user permissions might limit the accepted fields for the backend
        const newDataEntries = Object.entries(dirtyFieldObject).map<
          [string, BudgetFormValues[string][string]]
        >(([committee, dirtyFields]) => [
          committee,
          {
            ...(dirtyFields.estimate && { estimate: data[year][committee].estimate }),
            ...(dirtyFields.amount && { amount: data[year][committee].amount }),
            ...(dirtyFields.forecast && { forecast: data[year][committee].forecast }),
            ...(dirtyFields.contractPrice && {
              contractPrice: data[year][committee].contractPrice,
            }),
            ...(dirtyFields.kayttosuunnitelmanMuutos && {
              kayttosuunnitelmanMuutos: data[year][committee].kayttosuunnitelmanMuutos,
            }),
          },
        ]);

        return {
          ...dirtyValues,
          [year]: Object.fromEntries(newDataEntries),
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
    form.reset(data);
  }
  return !budget ? null : (
    <>
      <FormProvider {...form}>
        <form
          css={css`
            tr:nth-last-of-type(2) {
              td {
                ${'padding-bottom: 13px;'}
              }
            }

            td {
              text-align: right;
              ${'padding-top: 10px;padding-bottom: 10px;'}
            }

            & .MuiFormControl-root {
              margin: 0;
            }
            & .${TABLE_CELL_CONTENT_CLASS} {
              display: flex;
              justify-content: flex-end;
            }
            input::placeholder {
              color: black;
            }
          `}
          onSubmit={form.handleSubmit(onSubmit)}
          autoComplete="off"
        >
          <TableContainer
            css={css`
              overflow-x: visible; // To change nearest scrolling ancestor and to enable sticky header
            `}
          >
            <Table size="small">
              <TableHead
                css={css`
                  position: sticky;

                  background-color: white;
                  box-shadow: 0 1px 0 0 rgba(224, 224, 224, 1);
                  z-index: 1;
                  & .column-header {
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                  }
                  th {
                    padding-right: 8px;
                  }
                  & .MuiButtonBase-root {
                    padding-right: 0;
                  }
                `}
              >
                <TableRow>
                  <TableCell
                    css={css`
                      min-width: 120px;
                      padding-left: 16px;
                    `}
                    align="left"
                  >
                    <Box>
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
                            title={props.customTooltips?.actual ?? tr('budgetTable.ProjectObjectActualHelp')}
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
              <TableBody
                css={css`
                  input {
                    background-color: white;
                    border: solid 1px lightgray;
                    font-size: 13px;
                  }
                `}
              >
                {years?.map((year, yearIdx) => {
                  return (
                    <Fragment key={year}>
                      {
                        <BudgetContentRow
                          year={year}
                          includeYearColumn
                          writableFields={writableFields}
                          fields={fields}
                          actualsLoading={props.actualsLoading}
                          actuals={props.actuals}
                        />
                      }
                    </Fragment>
                  );
                })}

                <TotalRow
                  committeeColumnVisible={false}
                  actuals={props.actuals}
                  actualsLoading={Boolean(props.actualsLoading)}
                  fields={fields}
                  formValues={watch}
                  getFieldValue={getFieldTotalValueByYear}
                />
              </TableBody>
            </Table>
          </TableContainer>
        </form>
      </FormProvider>
    </>
  );
});
