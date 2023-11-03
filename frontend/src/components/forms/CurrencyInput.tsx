import { css } from '@emotion/react';
import { useEffect, useState } from 'react';
import CurrencyInputField from 'react-currency-input-field';

interface Props {
  value: number | null;
  onChange?: (value: number | null) => void;
  id?: string;
  name?: string;
  placeholder?: string;
  allowNegative?: boolean;
}

export function textValueToNumeric(value: string | undefined) {
  if (value == null || !value.length) {
    return null;
  }

  const isNegative = value.startsWith('-');
  const absoluteValue = isNegative ? value.slice(1) : value;

  const separator = absoluteValue.split('').find((character) => !/\d/.test(character));

  // Without separator, the number is a whole number
  if (!separator) {
    return Number(absoluteValue) * 100 * (isNegative ? -1 : 1);
  }

  const [whole, decimals] = absoluteValue.split(separator);
  const cents = decimals.length === 1 ? Number(decimals) * 10 : Number(decimals);
  return (Number(whole) * 100 + cents) * (isNegative ? -1 : 1);
}

export function numericValueToText(value: number | null): string {
  if (value == null) {
    return '';
  }
  if (value < 0) {
    return `-${numericValueToText(-value)}`;
  }
  const whole = Math.floor(value / 100);
  const decimals = String(value % 100);
  return `${whole}.${decimals.length === 1 ? '0' : ''}${decimals}`;
}

export function formatCurrency(value: number | null) {
  return value == null
    ? ''
    : new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR' }).format(value / 100);
}

const cssInputReadonly = css`
  background-color: #e3e3e3;
  text-align: right;
  border: none;
  outline: none;
  box-shadow: none;
  padding: 8px;
`;

const cssInputEditable = css`
  text-align: right;
  padding: 6px;
`;

export function CurrencyInput(props: Props) {
  const [value, setValue] = useState<string>(numericValueToText(props.value));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setValue(numericValueToText(props.value));
  }, [props.value]);

  if (!props.onChange) {
    return (
      <input readOnly tabIndex={-1} css={cssInputReadonly} value={formatCurrency(props.value)} />
    );
  }

  if (!editing) {
    return (
      <input
        readOnly
        css={cssInputEditable}
        value={formatCurrency(props.value)}
        onFocus={() => setEditing(true)}
      />
    );
  } else {
    return (
      <CurrencyInputField
        autoFocus
        css={css`
          text-align: right;
          padding: 6px;
        `}
        id={props.id}
        name={props.name}
        placeholder={props.placeholder}
        value={value}
        decimalsLimit={2}
        groupSeparator=" "
        decimalSeparator=","
        allowNegativeValue={props.allowNegative ?? false}
        onValueChange={(value) => {
          setValue(value ?? '');
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            setEditing(false);
            props.onChange?.(textValueToNumeric(value));
          } else if (event.key === 'Escape') {
            event.preventDefault();
            setEditing(false);
          }
        }}
        onBlur={() => {
          setEditing(false);
          props.onChange?.(textValueToNumeric(value));
        }}
      />
    );
  }
}
