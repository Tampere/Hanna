import { css } from '@emotion/react';
import { useEffect, useRef, useState } from 'react';
import CurrencyInputField from 'react-currency-input-field';

interface Props {
  value: number | null;
  onChange?: (value: number | null) => void;
  getColor?: (value: number | null) => string;
  autoFocus?: boolean;
  editing?: boolean;
  id?: string;
  name?: string;
  placeholder?: string;
  allowNegative?: boolean;
  className?: string;
  style?: React.CSSProperties;
  directlyHandleValueChange?: boolean;
}

export function valueTextColor(value: number | null) {
  return value && value < 0 ? 'red' : 'blue';
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
    return `-${numericValueToText(Math.abs(value))}`;
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

export function CurrencyInput(props: Readonly<Props>) {
  const [value, setValue] = useState<string>(numericValueToText(props.value));
  const [editing, setEditing] = useState(props.editing ?? false);
  const { style = { width: 157 } } = props;

  useEffect(() => {
    if (props.directlyHandleValueChange && editing) {
      // props.value is changed on every keystroke, so the value update is delayed until blur event
      return;
    }
    setValue(numericValueToText(props.value));
  }, [props.value]);

  const inputRef = useRef<HTMLInputElement>(null);

  const textColor = props?.getColor?.(props.value ?? null) ?? style.color ?? 'inherit';

  return (
    <CurrencyInputField
      autoFocus={props.autoFocus}
      readOnly={!editing || !props.onChange}
      className={props.className ?? ''}
      ref={inputRef}
      style={
        !props.onChange
          ? {
              ...style,
              backgroundColor: 'rgba(0, 0, 0, 0.08)',
              border: 'none',
              outline: 'none',
              color: textColor,
              textAlign: 'right',
              padding: 6,
            }
          : { ...style, color: textColor }
      }
      suffix="&nbsp;€"
      // NOTE: react-currency-input-field negative values broken with 'fi-FI' locale
      // groupSeparator and decimalSeparator overrides the en-US locale but somewhere
      // in that library logic fi-FI alters the behaviour of negative values, need to set this
      // explicitly to en-US to get the correct behaviour
      intlConfig={{ locale: 'en-US' }}
      groupSeparator=" "
      decimalSeparator=","
      maxLength={12}
      css={css`
        text-align: right;
        padding: 6px;
      `}
      id={props.id}
      name={props.name}
      placeholder={props.placeholder}
      value={value}
      decimalsLimit={0}
      allowNegativeValue={props.allowNegative ?? false}
      onValueChange={(val) => {
        if (props.directlyHandleValueChange) {
          props.onChange?.(textValueToNumeric(val));
        }
        setValue(val ?? '');
      }}
      onKeyDown={(event) => {
        if (!editing) {
          return;
        }
        if (event.key === 'Enter') {
          event.preventDefault();
          setEditing(false);
          inputRef.current?.blur();
          props.onChange?.(textValueToNumeric(value));
        } else if (event.key === '-' && !props.allowNegative) {
          event.preventDefault();
        }
      }}
      onFocus={() => {
        setEditing(true);
      }}
      onBlur={() => {
        setEditing(false);
        props.onChange?.(textValueToNumeric(value));
      }}
    />
  );
}
