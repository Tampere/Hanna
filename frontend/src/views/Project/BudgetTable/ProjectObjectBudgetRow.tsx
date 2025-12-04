import { Box, Skeleton, TableCell, TableRow, css } from '@mui/material';
import { useAtomValue } from 'jotai';

import { trpc } from '@frontend/client';
import { FormField } from '@frontend/components/forms';
import { CurrencyInput, valueTextColor } from '@frontend/components/forms/CurrencyInput';
import { ObjectStageIcon } from '@frontend/components/icons/ObjectStageIcon';
import { langAtom, useTranslations } from '@frontend/stores/lang';
import { getCommitteeAbbreviation } from '@frontend/utils/codes';

import { CommonDbProjectObject } from '@shared/schema/projectObject/base';
import { YearlyActuals } from '@shared/schema/sapActuals';

import { BudgetField, TABLE_CELL_CONTENT_CLASS } from '.';
import { MutedCommitteeChip, committeeColors } from './CommitteeSelection';

type BudgetTableProjectObject = CommonDbProjectObject & {
  objectCommittee?: string | null;
  objectStage?: string | null;
};

interface BudgetContentRowCellProps {
  projectObject: BudgetTableProjectObject;
  fields?: BudgetField[];
  year: number;
  writableFields?: BudgetField[];
  actualsLoading?: boolean;
  actuals?: YearlyActuals | null;
  disableBorder?: boolean;
  rowIndex: number;
}

export function ProjectObjectBudgetRow({
  projectObject,
  fields,
  year,
  writableFields,
  actualsLoading,
  actuals,
  disableBorder,
  rowIndex,
}: BudgetContentRowCellProps) {
  const committeeColor =
    committeeColors[(projectObject.objectCommittee as keyof typeof committeeColors) ?? 'default'];

  /** Form field identifier determines how the form data is structured.
   * We namespace project object fields under projectObjects.{projectObjectId}.{year}.{field}
   * to avoid collisions with the main project budget fields.
   */
  const tr = useTranslations();
  const lang = useAtomValue(langAtom);
  function getFormFieldIdentifier(year: number, field: BudgetField) {
    return `projectObjects.${projectObject.projectObjectId}.${String(year)}.${field}`;
  }
  function getObjectStageTextById(objectId: string) {
    return stageCodes?.data?.find((code) => code.id.id === objectId)?.text[lang] ?? '';
  }
  const stageCodes = trpc.code.get.useQuery(
    { codeListId: 'KohteenLaji', allowEmptySelection: false },
    { staleTime: Infinity },
  );

  return (
    <TableRow
      css={css`
        min-height: 50px;
        ${true ? 'td {border-bottom: none;}' : ''}
        background-color: ${rowIndex % 2 === 0 ? '#ffffff' : '#f0f0f0'};
      `}
    >
      {
        <TableCell
          css={css`
            &.MuiTableCell-root {
              text-align: left;
            }
          `}
        >
          {projectObject.objectName ?? '–'}
          {projectObject.objectCommittee && (
            <MutedCommitteeChip
              label={getCommitteeAbbreviation(projectObject.objectCommittee ?? '')}
              chipColor={committeeColor}
            />
          )}
          <Box
            css={css`
              padding-top: 4px;
              vertical-align: middle;
              display: inline-block;
            `}
          >
            {projectObject.objectStage && (
              <ObjectStageIcon
                title={getObjectStageTextById(projectObject.objectStage)}
                id={projectObject.objectStage}
              />
            )}
          </Box>
        </TableCell>
      }

      {fields?.includes('estimate') && (
        <TableCell>
          <FormField
            className={TABLE_CELL_CONTENT_CLASS}
            formField={getFormFieldIdentifier(year, 'estimate')}
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            component={({ ref, onChange, ...field }) => (
              <CurrencyInput
                css={css`
                  background-color: rgba(255, 255, 255, 0) !important;
                `}
                placeholder="–"
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
            className={TABLE_CELL_CONTENT_CLASS}
            formField={getFormFieldIdentifier(year, 'amount')}
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            component={({ ref, onChange, ...field }) => {
              return (
                <CurrencyInput
                  css={css`
                    background-color: rgba(255, 255, 255, 0) !important;
                  `}
                  placeholder="–"
                  directlyHandleValueChange
                  {...field}
                  onChange={writableFields?.includes('amount') ? onChange : undefined}
                />
              );
            }}
          />
        </TableCell>
      )}
      {fields?.includes('contractPrice') && (
        <TableCell>
          <FormField
            className={TABLE_CELL_CONTENT_CLASS}
            formField={getFormFieldIdentifier(year, 'contractPrice')}
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            component={({ ref, onChange, ...field }) => (
              <CurrencyInput
                css={css`
                  background-color: rgba(255, 255, 255, 0) !important;
                `}
                placeholder="–"
                directlyHandleValueChange
                {...field}
                onChange={writableFields?.includes('contractPrice') ? onChange : undefined}
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
                  css={css`
                    background-color: rgba(255, 255, 255, 0) !important;
                  `}
                  directlyHandleValueChange
                  value={(true ? actuals?.find((data) => data.year === year)?.total : null) ?? null}
                  placeholder={'–'}
                />
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
            formField={getFormFieldIdentifier(year, 'forecast')}
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            component={({ ref, onChange, ...field }) => (
              <CurrencyInput
                css={css`
                  background-color: rgba(255, 255, 255, 0) !important;
                `}
                placeholder="–"
                directlyHandleValueChange
                {...field}
                allowNegative
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
            formField={getFormFieldIdentifier(year, 'kayttosuunnitelmanMuutos')}
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            component={({ ref, onChange, ...field }) => (
              <CurrencyInput
                css={css`
                  background-color: rgba(255, 255, 255, 0) !important;
                `}
                placeholder="–"
                directlyHandleValueChange
                allowNegative
                style={{
                  width: '100%',
                  minWidth: 220,
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
