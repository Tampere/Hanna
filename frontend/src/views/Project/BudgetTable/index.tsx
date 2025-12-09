import {
  Box,
  Chip,
  CircularProgress,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  css,
} from '@mui/material';
import { useQueries } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  Fragment,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { trpc } from '@frontend/client';
import { HelpTooltip } from '@frontend/components/HelpTooltip';
import { ObjectStageIcon } from '@frontend/components/icons/ObjectStageIcon';
import { langAtom, useTranslations } from '@frontend/stores/lang';
import { useNavigationBlocker } from '@frontend/stores/navigationBlocker';
import { dirtyAndValidFieldsAtom } from '@frontend/stores/projectView';
import { useCodes } from '@frontend/utils/codes';

import { Code } from '@shared/schema/code';
import { ProjectYearBudget } from '@shared/schema/project';
import { ProjectType } from '@shared/schema/project/type';
import { CommonDbProjectObject, YearBudget } from '@shared/schema/projectObject/base';
import { YearlyActuals, yearlyAndCommitteeActuals } from '@shared/schema/sapActuals';

import { CommitteeSelection } from './CommitteeSelection';
import { ProjectObjectBudgetRow } from './ProjectObjectBudgetRow';
import { TotalRow } from './TotalRow';
import { YearTotalRow } from './YearTotalRow';

export const TABLE_CELL_CONTENT_CLASS = 'table-cell-content';

interface YearFilterProps {
  years: number[];
  startYear: number;
  endYear: number;
  onChange: (value: { start: number; end: number }) => void;
}

function YearFilter({ years, startYear, endYear, onChange }: YearFilterProps) {
  const tr = useTranslations();
  if (!years.length) return null;

  function handleStartChange(value: string) {
    const newStart = Number(value);
    let newEnd = endYear;
    if (newEnd < newStart) {
      newEnd = newStart;
    }
    onChange({ start: newStart, end: newEnd });
  }

  function handleEndChange(value: string) {
    const newEnd = Number(value);
    let newStart = startYear;
    if (newStart > newEnd) {
      newStart = newEnd;
    }
    onChange({ start: newStart, end: newEnd });
  }

  return (
    <Box
      css={css`
        padding-top: 8px;
        display: flex;
        align-items: center;
        gap: 0.25rem;
      `}
    >
      <Typography variant="body2">{tr('budgetTable.yearRange')}</Typography>
      <TextField
        select
        SelectProps={{ native: true }}
        size="small"
        value={startYear}
        onChange={(event) => handleStartChange(event.target.value)}
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </TextField>
      <Typography variant="body2">–</Typography>
      <TextField
        select
        SelectProps={{ native: true }}
        size="small"
        value={endYear}
        onChange={(event) => handleEndChange(event.target.value)}
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </TextField>
    </Box>
  );
}

interface ObjectStageFilterProps {
  availableStages: string[];
  selectedStages: string[];
  onChange: (value: string[]) => void;
}

function ObjectStageFilter({ availableStages, selectedStages, onChange }: ObjectStageFilterProps) {
  const stageCodes = useCodes('KohteenLaji');

  if (!availableStages.length) return null;

  function toggleStage(stageId: string) {
    onChange(
      selectedStages.includes(stageId)
        ? selectedStages.filter((id) => id !== stageId)
        : [...selectedStages, stageId],
    );
  }

  return (
    <Box
      css={css`
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
        position: sticky;
      `}
    >
      {availableStages.map((stageId) => {
        const code = stageCodes.get(stageId) as any;
        const label = code?.fi ?? stageId;
        const selected = selectedStages.includes(stageId);
        return (
          <Chip
            key={stageId}
            icon={
              <ObjectStageIcon
                id={stageId}
                title={label}
                cssProp={css`
                  font-size: 22px;
                `}
              />
            }
            onClick={() => toggleStage(stageId)}
            css={css`
              padding-left: 24px;
              padding-right: 0px;
              background-color: ${selected ? '#83e2e8' : '#defdffff'};
              :hover {
                opacity: 0.75;
                background-color: ${selected ? '#83e2e8' : '#d3f0f2'};
              }
              & .MuiChip-icon {
                padding-left: 24px;
                margin-right: 0;
              }
            `}
            variant={selected ? 'filled' : 'outlined'}
          />
        );
      })}
    </Box>
  );
}

export type BudgetField =
  | 'year'
  | 'committee'
  | 'estimate'
  | 'contractPrice'
  | 'amount'
  | 'forecast'
  | 'kayttosuunnitelmanMuutos'
  | 'actual';

type BudgetTableProjectObject = CommonDbProjectObject & {
  objectStage?: string | null;
  objectCommittee?: string | null;
};

interface Props {
  years: number[];
  budget: readonly ProjectYearBudget[];
  onSave: (budget: ProjectYearBudget[]) => Promise<void>;
  committees?: Code['id']['id'][];
  actuals?: yearlyAndCommitteeActuals;
  actualsLoading?: boolean;
  writableFields?: BudgetField[];
  fields?: BudgetField[];
  enableTooltips?: boolean;
  customTooltips?: Partial<Record<BudgetField, string>>;
  projectObjects?: BudgetTableProjectObject[];
  projectType?: Omit<ProjectType, 'detailplanProject'>;
}

export type BudgetFormValues =
  | Record<string, Record<string, ProjectYearBudget['budgetItems']>>
  | (Record<string, Record<string, ProjectYearBudget['budgetItems']>> & {
      projectObjects?: Record<string, Record<string, ProjectYearBudget['budgetItems']>>;
    });

function getFieldTotalValueByYear(
  fieldName: keyof ProjectYearBudget['budgetItems'],
  formValues?: BudgetFormValues,
) {
  if (!formValues) return null;

  const entries = Object.entries(formValues).filter(([key]) => key !== 'projectObjects');

  return entries.reduce<number>((total, [, budgetItem]) => {
    const yearTotals = (budgetItem as any)['total'] as ProjectYearBudget['budgetItems'] | undefined;
    return total + (yearTotals?.[fieldName] ?? 0);
  }, 0);
}

function getFieldTotalValueByCommittee(
  fieldName: keyof ProjectYearBudget['budgetItems'],
  selectedCommittees: string[],
  formValues?: BudgetFormValues,
) {
  if (!formValues) return null;

  return Object.values(formValues).reduce<number>((total, budgetItem) => {
    const committeeSum = Object.entries(
      budgetItem as Record<string, ProjectYearBudget['budgetItems']>,
    )
      .filter(([committee]) => selectedCommittees.includes(committee))
      .reduce<number>((committeeTotal, [, committeeItem]) => {
        return committeeTotal + (committeeItem[fieldName] ?? 0);
      }, 0);

    return total + committeeSum;
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

function projectObjectsToFormValues(
  projectObjects?: CommonDbProjectObject[],
  projectObjectBudgets?: Map<string, YearBudget[]>,
): Record<string, Record<string, ProjectYearBudget['budgetItems']>> {
  const result: Record<string, Record<string, ProjectYearBudget['budgetItems']>> = {};

  if (!projectObjects) return result;

  for (const po of projectObjects) {
    const poId = po.projectObjectId;

    if (!result[poId]) {
      result[poId] = {};
    }

    const emptyBudgetItems: ProjectYearBudget['budgetItems'] = {
      estimate: null,
      amount: null,
      forecast: null,
      contractPrice: null,
      kayttosuunnitelmanMuutos: null,
    };

    // Seed from persisted budgets (projectObject.getBudget)
    const budgets = projectObjectBudgets?.get(poId) ?? [];
    for (const { year, budgetItems } of budgets) {
      const yearKey = String(year);

      result[poId][yearKey] = {
        ...emptyBudgetItems,
        estimate: !isNullish(budgetItems.estimate) ? budgetItems.estimate : null,
        amount: !isNullish(budgetItems.amount) ? budgetItems.amount : null,
        forecast: !isNullish(budgetItems.forecast) ? budgetItems.forecast : null,
        contractPrice: !isNullish(budgetItems.contractPrice) ? budgetItems.contractPrice : null,
        kayttosuunnitelmanMuutos: !isNullish(budgetItems.kayttosuunnitelmanMuutos)
          ? budgetItems.kayttosuunnitelmanMuutos
          : null,
      };
    }

    // Overlay any pending budgetUpdate values on top of persisted ones
    const budgetUpdate = po.budgetUpdate;
    if (!budgetUpdate) continue;

    for (const item of budgetUpdate.budgetItems) {
      const yearKey = String(item.year);
      const existing = result[poId][yearKey] ?? emptyBudgetItems;

      result[poId][yearKey] = {
        ...existing,
        ...(item.estimate !== undefined && { estimate: item.estimate }),
        ...(item.amount !== undefined && { amount: item.amount }),
        ...(item.forecast !== undefined && { forecast: item.forecast }),
        ...(item.contractPrice !== undefined && { contractPrice: item.contractPrice }),
        ...(item.kayttosuunnitelmanMuutos !== undefined && {
          kayttosuunnitelmanMuutos: item.kayttosuunnitelmanMuutos,
        }),
      };
    }
  }

  return result;
}

const cellStyle = css`
  text-align: right;
`;

function projectObjectIsActiveInYear(projectObject: CommonDbProjectObject, year: number): boolean {
  const startYear = Number(projectObject.startDate.slice(0, 4));
  const endYear = Number(projectObject.endDate.slice(0, 4));

  if (Number.isNaN(startYear) || Number.isNaN(endYear)) {
    return true;
  }

  return year >= startYear && year <= endYear;
}

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
  const [hiddenYears, setHiddenYears] = useState<number[]>([]);
  const [selectedCommittees, setSelectedCommittees] = useState<string[]>(props.committees ?? []);
  const [yearRange, setYearRange] = useState<{ start: number; end: number }>({
    start: Math.min(...years),
    end: Math.max(...years),
  });
  const [selectedObjectStages, setSelectedObjectStages] = useState<string[]>([]);
  const [hideZeroRows, setHideZeroRows] = useState(false);

  const visibleYears = useMemo(() => {
    const { start, end } = yearRange;
    return years.filter((year) => {
      const meetsStart = year >= start;
      const meetsEnd = year <= end;
      return meetsStart && meetsEnd;
    });
  }, [years, yearRange]);

  const availableObjectStages = useMemo(
    () =>
      Array.from(
        new Set(
          (props.projectObjects ?? [])
            .map((po) => po.objectStage)
            .filter((stage): stage is string => Boolean(stage)),
        ),
      ),
    [props.projectObjects],
  );

  // Fetch project object budgets via projectObject.getBudget
  const projectObjectIds = useMemo(
    () => (props.projectObjects ?? []).map((po) => po.projectObjectId),
    [props.projectObjects],
  );

  const utils = trpc.useUtils();
  const projectObjectBudgetQueries = useQueries({
    queries: projectObjectIds.map((id) => ({
      queryKey: ['projectObjectBudget', id],
      queryFn: () => utils.projectObject.getBudget.fetch({ projectObjectId: id }),
      enabled: Boolean(id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const projectObjectBudgets = useMemo(() => {
    const map = new Map<string, YearBudget[]>();
    projectObjectBudgetQueries.forEach((q, idx) => {
      const id = projectObjectIds[idx];
      if (q.data) {
        map.set(id, q.data as YearBudget[]);
      }
    });
    return map;
  }, [
    projectObjectBudgetQueries.map((q) => q.dataUpdatedAt).join(','),
    projectObjectIds.join(','),
  ]);

  const projectObjectBudgetsLoaded = useMemo(
    () =>
      projectObjectIds.length === 0 ||
      projectObjectBudgetQueries.every((q) => Boolean(q.data) || q.isError),
    [projectObjectBudgetQueries.map((q) => q.dataUpdatedAt).join(','), projectObjectIds.length],
  );

  // --- Project object actuals (SAP) ---
  const [minYear, maxYear] = useMemo(() => {
    if (!years.length) return [undefined, undefined] as [number | undefined, number | undefined];
    return [Math.min(...years), Math.max(...years)] as [number, number];
  }, [years]);

  const projectObjectActualsQueries = useQueries({
    queries: projectObjectIds.map((id) => ({
      queryKey: ['sapYearlyActualsByProjectObjectId', id, minYear, maxYear],
      queryFn: () =>
        utils.sap.getYearlyActualsByProjectObjectId.fetch({
          projectObjectId: id,
          startYear: minYear as number,
          endYear: maxYear as number,
        }),
      enabled: Boolean(id) && minYear !== undefined && maxYear !== undefined,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const projectObjectActualsById = useMemo(() => {
    const map = new Map<string, YearlyActuals | null>();
    projectObjectActualsQueries.forEach((q, idx) => {
      const id = projectObjectIds[idx];
      if (!id) return;
      if (q.data === null) {
        map.set(id, null);
      } else if (q.data) {
        map.set(id, q.data as YearlyActuals);
      }
    });
    return map;
  }, [
    projectObjectActualsQueries.map((q) => q.dataUpdatedAt).join(','),
    projectObjectIds.join(','),
  ]);

  // Pre-compute yearly actuals from project objects so that the "Actual" totals
  // (both per-year and grand total) respect the same filters as the table
  // (committees, object stages, year range).
  const yearlyActualsFromObjects = useMemo(() => {
    if (!props.projectObjects || props.projectObjects.length === 0) {
      return null;
    }

    const result: YearlyActuals = [];

    for (const year of visibleYears) {
      const filteredProjectObjects = (props.projectObjects ?? [])
        .filter((po) => projectObjectIsActiveInYear(po, year))
        .filter((po) => {
          // If no committees are used (maintenance projects), show all objects
          if (!props.committees || props.committees.length === 0) {
            return true;
          }
          // Otherwise filter by committee
          return po.objectCommittee && selectedCommittees.includes(po.objectCommittee);
        })
        .filter(
          (po) =>
            selectedObjectStages.length === 0 ||
            (po.objectStage && selectedObjectStages.includes(po.objectStage)),
        );

      if (filteredProjectObjects.length === 0) {
        continue;
      }

      const totalForYear = filteredProjectObjects.reduce((sum, po) => {
        const objectActuals = projectObjectActualsById.get(po.projectObjectId) ?? null;
        if (!objectActuals) return sum;
        const yearActual = objectActuals.find((a) => a.year === year)?.total ?? 0;
        return sum + (yearActual || 0);
      }, 0);

      result.push({ year, total: totalForYear });
    }

    return result.length > 0 ? result : null;
  }, [
    visibleYears.join(','),
    props.projectObjects
      ? props.projectObjects
          .map(
            (po) =>
              `${po.projectObjectId}-${po.objectCommittee ?? ''}-${po.objectStage ?? ''}-${
                po.startDate
              }-${po.endDate}`,
          )
          .join('|')
      : '',
    props.committees ? props.committees.join(',') : '',
    selectedCommittees.join(','),
    selectedObjectStages.join(','),
    projectObjectActualsQueries.map((q) => q.dataUpdatedAt).join(','),
    projectObjectIds.join(','),
  ]);

  const projectObjectActualsLoadingById = useMemo(() => {
    const map = new Map<string, boolean>();
    projectObjectActualsQueries.forEach((q, idx) => {
      const id = projectObjectIds[idx];
      if (!id) return;
      map.set(id, q.isLoading || q.isFetching);
    });
    return map;
  }, [projectObjectActualsQueries.map((q) => q.fetchStatus).join(','), projectObjectIds.join(',')]);

  // Track refs to the per-year total rows so we can scroll to the current year
  // once data has been loaded.
  const yearRowRefs = useRef<Record<number, HTMLTableRowElement | null>>({});

  const tr = useTranslations();
  const lockedYears = trpc.lockedYears.get.useQuery().data ?? [];
  const form = useForm<BudgetFormValues>({ mode: 'all', defaultValues: {} });
  const { isDirty, dirtyFields } = form.formState;

  const setDirtyAndValidViews = useSetAtom(dirtyAndValidFieldsAtom);
  const watch = form.watch();
  useNavigationBlocker(Object.keys(dirtyFields).length > 0, 'budgetTable', () => {
    setDirtyAndValidViews((prev) => ({ ...prev, finances: { isDirtyAndValid: false } }));
  });
  const lang = useAtomValue(langAtom);
  const committeeCodes = useCodes('Lautakunta');

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
      (dirtyValues, [key, dirtyFieldObject]) => {
        if (!dirtyFieldObject) {
          return dirtyValues;
        }

        if (key === 'projectObjects') {
          // Project object budgets are handled separately in onSubmit
          return dirtyValues;
        }

        // key is year here
        const year = key;
        // Get only dirty fields for submission since the user permissions might limit the accepted fields for the backend
        const newDataEntries = Object.entries(dirtyFieldObject as Record<string, any>).map<
          [string, BudgetFormValues[string][string]]
        >(([committee, committeeDirtyFields]) => [
          committee,
          {
            ...(committeeDirtyFields.estimate && { estimate: data[year][committee].estimate }),
            ...(committeeDirtyFields.amount && { amount: data[year][committee].amount }),
            ...(committeeDirtyFields.forecast && { forecast: data[year][committee].forecast }),
            ...(committeeDirtyFields.contractPrice && {
              contractPrice: data[year][committee].contractPrice,
            }),
            ...(committeeDirtyFields.kayttosuunnitelmanMuutos && {
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

  useEffect(() => {
    if (availableObjectStages.length && selectedObjectStages.length === 0) {
      setSelectedObjectStages(availableObjectStages);
    }
  }, [availableObjectStages, selectedObjectStages.length]);

  const committees = useMemo(
    () =>
      selectedCommittees?.map((committee) => ({
        id: committee,
        text: committeeCodes.get(committee)?.[lang].replace(/lautakunta/g, ' ') ?? '',
      })),
    [selectedCommittees, committeeCodes],
  );

  /**
   * Seed main project budget (year/committee) into the form.
   * Project object budgets are handled in a separate effect.
   */
  useEffect(() => {
    if (!budget) {
      return;
    }

    const currentValues = form.getValues() as BudgetFormValues;

    form.reset({
      ...budgetToFormValues([...budget], years, props.committees),
      // Preserve any existing projectObjects state; it will be seeded separately if empty
      projectObjects: (currentValues as any).projectObjects ?? {},
    } as BudgetFormValues);
  }, [budget, years, props.committees]);

  /**
   * Seed project object budgets once, after they have been loaded.
   * Do not overwrite if user has already edited projectObjects fields.
   *
   * We use setValue for each field instead of form.reset to avoid
   * react-hook-form deep-merge quirks with numeric keys.
   */
  const hasSeededProjectObjectsRef = useRef(false);
  const [hasAutoScrolled, setHasAutoScrolled] = useState(false);

  useEffect(() => {
    if (hasSeededProjectObjectsRef.current) return;
    if (!props.projectObjects || props.projectObjects.length === 0) return;

    const anyBudgetUpdate = props.projectObjects.some(
      (po) => po.budgetUpdate && po.budgetUpdate.budgetItems.length > 0,
    );

    // Wait until project object budgets are loaded or we have budgetUpdate data
    if (!projectObjectBudgetsLoaded && !anyBudgetUpdate) {
      return;
    }

    const seed = projectObjectsToFormValues(props.projectObjects, projectObjectBudgets);

    (Object.entries(seed) as [string, Record<string, ProjectYearBudget['budgetItems']>][])?.forEach(
      ([projectObjectId, yearsMap]) => {
        Object.entries(yearsMap).forEach(([yearKey, budgetItems]) => {
          (
            ['estimate', 'amount', 'forecast', 'contractPrice', 'kayttosuunnitelmanMuutos'] as const
          ).forEach((fieldName) => {
            const value = budgetItems[fieldName];
            if (!isNullish(value)) {
              form.setValue(
                `projectObjects.${projectObjectId}.${yearKey}.${fieldName}` as any,
                value as any,
                {
                  shouldDirty: false,
                  shouldTouch: false,
                  shouldValidate: false,
                },
              );
            }
          });
        });
      },
    );

    hasSeededProjectObjectsRef.current = true;
  }, [projectObjectBudgetsLoaded, projectObjectBudgets, props.projectObjects]);

  useEffect(() => {
    setDirtyAndValidViews((prev) => {
      return {
        ...prev,
        finances: { isDirtyAndValid: isDirty },
      };
    });
  }, [isDirty]);

  // Consider data "loaded" for scrolling when:
  // - the base project budget is present,
  // - any project object budgets/actuals (if used) have finished loading, and
  const objectDataLoaded =
    !props.projectObjects ||
    props.projectObjects.length === 0 ||
    (projectObjectBudgetsLoaded &&
      hasSeededProjectObjectsRef.current &&
      projectObjectActualsQueries.every((q) => !q.isLoading && !q.isFetching));

  const tableDataLoaded = objectDataLoaded && !props.actualsLoading;

  useEffect(() => {
    if (hasAutoScrolled) return;
    if (!budget || years.length === 0) return;
    if (!tableDataLoaded) return;

    const timeoutId = window.setTimeout(() => {
      const nowYear = new Date().getFullYear();
      const targetYear = visibleYears.includes(nowYear)
        ? nowYear
        : visibleYears[visibleYears.length - 1];

      const rowEl = yearRowRefs.current[targetYear];
      if (rowEl) {
        rowEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
        setHasAutoScrolled(true);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [budget, years.length, visibleYears.join(','), tableDataLoaded, hasAutoScrolled]);

  async function onSubmit(data: BudgetFormValues) {
    const projectBudget = formValuesToBudget(getDirtyValues(data), years);

    // Collect dirty project object budgets, if any
    const projectObjectBudgets: {
      projectObjectId: string;
      year: number;
      budgetItems: ProjectYearBudget['budgetItems'];
    }[] = [];

    const projectObjectDirty = (dirtyFields as any).projectObjects as
      | Record<string, Record<string, Partial<ProjectYearBudget['budgetItems']>>>
      | undefined;

    if (projectObjectDirty && (data as any).projectObjects) {
      const projectObjectValues = (data as any).projectObjects as Record<
        string,
        Record<string, ProjectYearBudget['budgetItems']>
      >;

      for (const [projectObjectId, yearsMap] of Object.entries(projectObjectDirty)) {
        for (const [yearKey, fieldsDirty] of Object.entries(yearsMap)) {
          const year = Number(yearKey);
          const value = projectObjectValues[projectObjectId]?.[yearKey];
          if (!value) continue;

          // Only include fields that are actually dirty so that
          // financial-writer-only users send just amount / kayttosuunnitelmanMuutos
          // and pass the strict backend schema.
          const budgetItems: Partial<ProjectYearBudget['budgetItems']> = {
            ...((fieldsDirty as any).estimate && { estimate: value.estimate ?? null }),
            ...((fieldsDirty as any).contractPrice && {
              contractPrice: value.contractPrice ?? null,
            }),
            ...((fieldsDirty as any).amount && { amount: value.amount ?? null }),
            ...((fieldsDirty as any).forecast && { forecast: value.forecast ?? null }),
            ...((fieldsDirty as any).kayttosuunnitelmanMuutos && {
              kayttosuunnitelmanMuutos: value.kayttosuunnitelmanMuutos ?? null,
            }),
          };

          projectObjectBudgets.push({
            projectObjectId,
            year,
            budgetItems: budgetItems as ProjectYearBudget['budgetItems'],
          });
        }
      }
    }

    // @ts-expect-error onSave may accept project object budgets
    await onSave(projectBudget, projectObjectBudgets);
    form.reset(data);
  }

  function projectObjectHasNonZeroValuesForYear(
    projectObject: CommonDbProjectObject,
    year: number,
  ): boolean {
    if (!projectObjectBudgetsLoaded) {
      // Do not hide rows while project object budgets are still loading
      return true;
    }

    const formValues = watch as any;
    const poMap = formValues.projectObjects as
      | Record<string, Record<string, ProjectYearBudget['budgetItems']>>
      | undefined;
    if (!poMap) return false;

    const byYear = poMap[projectObject.projectObjectId];
    if (!byYear) return false;

    const items = byYear[String(year)];
    if (!items) return false;

    const budgetFields: (keyof ProjectYearBudget['budgetItems'])[] = [
      'estimate',
      'amount',
      'forecast',
      'contractPrice',
      'kayttosuunnitelmanMuutos',
    ];

    for (const fieldName of budgetFields) {
      // Only consider fields that are currently visible in the table
      if (!(fields as BudgetField[] | undefined)?.includes(fieldName as BudgetField)) continue;
      const val = items[fieldName];
      if (typeof val === 'number' && val !== 0) {
        return true;
      }
    }

    return false;
  }

  return !budget ? null : (
    <>
      <FormProvider {...form}>
        <Box
          css={css`
            position: sticky;
            top: 0;
            left: 0;
            right: 0;
            z-index: 2;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 1rem;
            margin-bottom: 0.5rem;
            background-color: white;
            padding-top: 0.5rem;
            padding-bottom: 0.5rem;
          `}
        >
          {props.committees && props.committees.length > 1 && (
            <>
              <CommitteeSelection
                availableCommittees={(
                  props.projectObjects?.map((po) => po.objectCommittee ?? '') ?? []
                ).filter((v, i, a) => v && a.indexOf(v) === i)}
                selectedCommittees={selectedCommittees}
                setSelectedCommittees={setSelectedCommittees}
              />
              <Box
                css={css`
                  position: sticky;
                  width: 2px;
                  background-color: #d0d0d0;
                  align-self: stretch;
                `}
              />
            </>
          )}

          {props.projectObjects && availableObjectStages.length > 1 && (
            <>
              <ObjectStageFilter
                availableStages={availableObjectStages}
                selectedStages={selectedObjectStages}
                onChange={setSelectedObjectStages}
              />
              <Box
                css={css`
                  width: 2px;
                  background-color: #d0d0d0;
                  align-self: stretch;
                `}
              />
            </>
          )}

          <YearFilter
            years={years}
            startYear={yearRange.start}
            endYear={yearRange.end}
            onChange={setYearRange}
          />
          <Box
            css={css`
              width: 2px;
              background-color: #d0d0d0;
              align-self: stretch;
            `}
          />
          <FormControlLabel
            control={
              <Switch
                checked={hideZeroRows}
                onChange={(event) => setHideZeroRows(event.target.checked)}
              />
            }
            label="Piilota nollarivit"
          />
        </Box>

        <form
          css={css`
            tr:nth-last-of-type(2) {
              td {
                ${(selectedCommittees.length === 1 || selectedCommittees.length === 0) &&
                'padding-bottom: 13px;'}
              }
            }

            td {
              text-align: right;
              ${(selectedCommittees.length === 1 || selectedCommittees.length === 0) &&
              'padding-top: 10px;padding-bottom: 10px;'}
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
                  top: 64px;
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
                      min-width: 320px;
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
                    <TableCell css={cellStyle}>
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
                    <TableCell css={cellStyle}>
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
                            title={
                              props.customTooltips?.actual ?? tr('budgetTable.ProjectActualHelp')
                            }
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
                        min-width: 265px;
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
                {visibleYears?.map((year, yearIdx) => {
                  return (
                    <Fragment key={year}>
                      {true && (
                        <Fragment>
                          {(() => {
                            // Compute yearly totals from the projectObjects subtree so filtering by
                            // objectStage and committee is reflected in the total line.
                            const filteredProjectObjects = (props.projectObjects ?? [])
                              .filter((po) => projectObjectIsActiveInYear(po, year))
                              .filter((po) => {
                                // If no committees are used (maintenance projects), show all objects
                                if (!props.committees || props.committees.length === 0) {
                                  return true;
                                }
                                // Otherwise filter by committee
                                return (
                                  po.objectCommittee &&
                                  selectedCommittees.includes(po.objectCommittee)
                                );
                              })
                              .filter(
                                (po) =>
                                  selectedObjectStages.length === 0 ||
                                  (po.objectStage && selectedObjectStages.includes(po.objectStage)),
                              );

                            const getFieldValueFromObjects = (
                              fieldName: keyof ProjectYearBudget['budgetItems'],
                              formValues: BudgetFormValues,
                              targetYear: number,
                            ) => {
                              const poMap = (formValues as any).projectObjects as
                                | Record<string, Record<string, ProjectYearBudget['budgetItems']>>
                                | undefined;
                              if (!poMap || filteredProjectObjects.length === 0) return 0;

                              const yearKey = String(targetYear);
                              let sum = 0;
                              for (const po of filteredProjectObjects) {
                                const byYear = poMap[po.projectObjectId];
                                const items = byYear?.[yearKey];
                                if (!items) continue;
                                const val = items[fieldName];
                                if (typeof val === 'number') {
                                  sum += val;
                                }
                              }
                              return sum;
                            };

                            const actualFromObjects =
                              yearlyActualsFromObjects?.find((entry) => entry.year === year)
                                ?.total ?? null;

                            const actualsLoadingFromObjects = filteredProjectObjects.some((po) =>
                              projectObjectActualsLoadingById.get(po.projectObjectId),
                            );

                            return (
                              <YearTotalRow
                                rowRef={(el) => {
                                  yearRowRefs.current[year] = el;
                                }}
                                actual={actualFromObjects}
                                sapActual={
                                  props.actuals && 'yearlyActuals' in props.actuals
                                    ? props.actuals?.yearlyActuals
                                        ?.filter((sapYearlyActual) => sapYearlyActual.year === year)
                                        .reduce(
                                          (total, sapYearlyActual) => sapYearlyActual.total + total,
                                          0,
                                        )
                                    : null
                                }
                                actualsLoading={
                                  actualsLoadingFromObjects || Boolean(props.actualsLoading)
                                }
                                fields={fields}
                                selectedCommittees={selectedCommittees}
                                formValues={watch}
                                year={year}
                                getFieldValue={getFieldValueFromObjects}
                                onHideYear={
                                  props.projectObjects
                                    ? () =>
                                        setHiddenYears((prev) =>
                                          prev.includes(year)
                                            ? prev.filter((y) => y !== year)
                                            : [...prev, year],
                                        )
                                    : undefined
                                }
                                isHidden={hiddenYears.includes(year)}
                              />
                            );
                          })()}
                          {props.projectObjects
                            ? props.projectObjects
                                .filter((po) => projectObjectIsActiveInYear(po, year))
                                .filter((po) => {
                                  // If no committees are used (maintenance projects), show all objects
                                  if (!props.committees || props.committees.length === 0) {
                                    return true;
                                  }
                                  // Otherwise filter by committee
                                  return (
                                    po.objectCommittee &&
                                    selectedCommittees.includes(po.objectCommittee)
                                  );
                                })
                                .filter(
                                  (po) =>
                                    selectedObjectStages.length === 0 ||
                                    (po.objectStage &&
                                      selectedObjectStages.includes(po.objectStage)),
                                )
                                .filter(
                                  (po) =>
                                    !hideZeroRows || projectObjectHasNonZeroValuesForYear(po, year),
                                )
                                .filter((po) => !hiddenYears.includes(year))
                                .map((projectObject, index) => {
                                  // Use writableFields from props (set at project level)
                                  const writableForYear = lockedYears.includes(year)
                                    ? (writableFields || []).filter((field) => field !== 'amount')
                                    : writableFields || [];

                                  const finalWritableFields = projectObjectBudgetsLoaded
                                    ? writableForYear
                                    : [];

                                  const objectActuals =
                                    projectObjectActualsById.get(projectObject.projectObjectId) ??
                                    null;
                                  const objectActualsLoading =
                                    projectObjectActualsLoadingById.get(
                                      projectObject.projectObjectId,
                                    ) ?? false;

                                  return (
                                    <ProjectObjectBudgetRow
                                      key={`${year}-${projectObject.projectObjectId}`}
                                      projectObject={projectObject}
                                      year={year}
                                      fields={fields}
                                      writableFields={finalWritableFields}
                                      actualsLoading={objectActualsLoading}
                                      actuals={objectActuals}
                                      rowIndex={index}
                                    />
                                  );
                                })
                            : null}
                          {
                            <TableRow
                              css={css`
                                height: 1rem;
                                border-bottom: ${yearIdx !== visibleYears.length - 1
                                  ? '1px solid rgba(224, 224, 224, 1)'
                                  : 'none'};
                              `}
                            />
                          }
                        </Fragment>
                      )}
                    </Fragment>
                  );
                })}

                <TotalRow
                  committeeColumnVisible={false /* disables padding */}
                  // When project objects are present, derive the "Actual" total from
                  // the per-object actuals that are currently visible under the
                  // active filters (committees, stages, year range). Otherwise,
                  // fall back to the aggregated project-level actuals.
                  actuals={
                    props.projectObjects && yearlyActualsFromObjects
                      ? yearlyActualsFromObjects
                      : props.actuals && 'byCommittee' in props.actuals
                        ? props.actuals?.byCommittee?.filter((value) =>
                            selectedCommittees.includes(value.committeeId),
                          )
                        : null
                  }
                  actualsLoading={
                    props.projectObjects
                      ? projectObjectActualsQueries.some((q) => q.isLoading || q.isFetching)
                      : Boolean(props.actualsLoading)
                  }
                  fields={
                    selectedCommittees.length === 1
                      ? fields.filter((f) => f !== 'committee')
                      : fields
                  }
                  sapActuals={
                    props.actuals && 'yearlyActuals' in props.actuals
                      ? props.actuals?.yearlyActuals?.reduce(
                          (total, sapYearlyActual) => sapYearlyActual.total + total,
                          0,
                        )
                      : null
                  }
                  formValues={watch}
                  getFieldValue={
                    fields.includes('committee')
                      ? (fieldName, formValues) =>
                          getFieldTotalValueByCommittee(fieldName, selectedCommittees, formValues)
                      : getFieldTotalValueByYear
                  }
                />
              </TableBody>
            </Table>
          </TableContainer>
        </form>
      </FormProvider>
    </>
  );
});
