import { css } from '@emotion/react';
import { useEffect, useRef } from 'react';

import { formatCurrency } from '@frontend/components/forms/CurrencyInput';
import { useTranslations } from '@frontend/stores/lang';

import { FinancesItem } from '@shared/schema/workTable';

const cssHintStyle = css`
  color: #999;
`;

const cssContainerStyle = (props: { alignItems?: 'center' | 'flex-end' } = {}) => css`
  width: 72px;
  display: flex;
  font-size: 11px;
  flex-direction: column;
  align-items: ${props?.alignItems ?? 'flex-end'};
`;

interface Props {
  value: FinancesItem;
  notInRange: boolean;
  readOnly: boolean;
}

/**
 * Finances component for the DataGrid
 * @param {Object} props - Properties passed to component
 * @param {FinancesItem} props.value - The value of the finances item
 * @param {boolean} props.notInRange - Flag indicating if the value is not in range
 * @param {boolean} props.readOnly - Flag indicating if the component is read only
 */

export function Finances({ value, notInRange, readOnly }: Props) {
  const tr = useTranslations();
  const { budget, actual } = value;
  const ref = useRef<HTMLDivElement>(null);

  // NOTE: this is workaround to set single cell cursor to not-allowed since DataGrid
  // does not allow column class name to be selected on row-basis. It is all or nothing
  useEffect(() => {
    if (ref.current) {
      // find the next ancestor where role="cell" and apply style
      let cell = ref.current.parentElement;
      while (cell && cell.getAttribute('role') !== 'cell') {
        cell = cell.parentElement;
      }
      if (cell) {
        cell.style.cursor = notInRange || readOnly ? 'not-allowed' : 'default';
      }
    }
  }, [ref, readOnly]);

  if (notInRange) {
    return (
      <div ref={ref} css={cssContainerStyle({ alignItems: 'center' })}>
        <b css={cssHintStyle}>—</b>
      </div>
    );
  } else {
    return (
      <div ref={ref} css={cssContainerStyle()}>
        {budget ? (
          <div>{formatCurrency(budget)}</div>
        ) : (
          <i css={cssHintStyle}>{tr('workTable.noBudget')}</i>
        )}
        {actual ? (
          <div>{formatCurrency(actual)}</div>
        ) : (
          <i css={cssHintStyle}>{tr('workTable.noActual')} </i>
        )}
      </div>
    );
  }
}
