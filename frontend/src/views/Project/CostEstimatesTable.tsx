import { Edit, Save, Undo } from '@mui/icons-material';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { FormField } from '@frontend/components/forms';
import { CurrencyInput } from '@frontend/components/forms/CurrencyInput';
import { useTranslations } from '@frontend/stores/lang';

import { CostEstimate } from '@shared/schema/project';

interface Props {
  years: number[];
  estimates: readonly CostEstimate[];
  onSave: (estimates: CostEstimate[]) => Promise<void>;
}

type EstimateFormValues = Record<string, number | null>;

function estimatesToFormValues(estimates: CostEstimate[], projectYears: number[]) {
  return projectYears.reduce(
    (values, year) => ({
      ...values,
      [year]: estimates.find((item) => item.year === year)?.estimates[0]?.amount ?? null,
    }),
    {} as EstimateFormValues
  );
}

function formValuesToEstimates(values: EstimateFormValues, projectYears: number[]): CostEstimate[] {
  return projectYears.map((year) => ({
    year,
    estimates: [{ amount: values[year] ?? null }],
  }));
}

export function CostEstimatesTable(props: Props) {
  const { years, estimates, onSave } = props;

  const [editing, setEditing] = useState(false);

  const tr = useTranslations();
  const form = useForm<EstimateFormValues>({ mode: 'all', defaultValues: {} });
  const watch = form.watch();

  /**
   * Convert estimates from object into a simple array for the form
   */
  useEffect(() => {
    if (!estimates) {
      return;
    }
    // Fill in all the years within the project's range
    form.reset(estimatesToFormValues([...estimates], years));
  }, [estimates, years]);

  async function onSubmit(data: EstimateFormValues) {
    await onSave(formValuesToEstimates(data, years));
    setEditing(false);
    form.reset();
  }

  return !estimates ? null : (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        {!editing ? (
          <Button
            variant="contained"
            size="small"
            onClick={() => setEditing(!editing)}
            endIcon={<Edit />}
          >
            {tr('projectForm.editBtnLabel')}
          </Button>
        ) : (
          <Button
            variant="outlined"
            size="small"
            color="secondary"
            onClick={() => {
              form.reset();
              setEditing(!editing);
            }}
            endIcon={<Undo />}
          >
            {tr('projectForm.undoBtnLabel')}
          </Button>
        )}
      </Box>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Typography variant="overline">{tr('costEstimatesTable.year')}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="overline"> {tr('costEstimatesTable.estimate')}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="overline">{tr('costEstimatesTable.actual')}</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {years?.map((year) => (
                  <TableRow key={year}>
                    <TableCell>{year}</TableCell>
                    <TableCell>
                      <FormField
                        formField={String(year)}
                        component={(field) => {
                          const innerRef = field.ref;
                          return (
                            <CurrencyInput
                              {...{ ...field, ref: undefined }}
                              innerRef={innerRef}
                              editing={!editing}
                            />
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <CurrencyInput readOnly value={null} /> {/* TODO */}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell>
                    <Typography variant="overline">{tr('costEstimatesTable.total')}</Typography>
                  </TableCell>
                  <TableCell>
                    <CurrencyInput
                      readOnly
                      value={
                        watch &&
                        Object.values(watch).reduce((total, amount) => {
                          return (total || 0) + (amount || 0);
                        }, 0)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <CurrencyInput readOnly value={null} />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          {editing && (
            <Button
              size="small"
              type="submit"
              variant="contained"
              sx={{ mt: 2 }}
              disabled={!form.formState.isDirty}
              endIcon={<Save />}
            >
              {tr('projectForm.saveBtnLabel')}
            </Button>
          )}
        </form>
      </FormProvider>
    </>
  );
}
