import { InputAdornment, TextField, TextFieldProps } from '@mui/material';
import { Ref, useEffect, useMemo, useState } from 'react';
import CurrencyInputField from 'react-currency-input-field';

interface Props {
  id?: string;
  name?: string;
  innerRef: Ref<HTMLInputElement>;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  readOnly?: boolean;
  disabled?: boolean;
  TextFieldProps?: TextFieldProps;
}

function textValueToNumeric(value: string | undefined) {
  if (value == null || !value.length) {
    return null;
  }
  const separator = value.split('').find((character) => !/\d/.test(character));

  // Without separator, the number is a whole number
  if (!separator) {
    return Number(value) * 100;
  }

  const [whole, decimals] = value.split(separator);
  const cents = decimals.length === 1 ? Number(decimals) * 10 : Number(decimals);
  return Number(whole) * 100 + cents;
}

function numericValueToText(value: number | null) {
  if (value == null) {
    return '';
  }
  const whole = Math.floor(value / 100);
  const decimals = String(value % 100);
  return `${whole}.${decimals.length === 1 ? '0' : ''}${decimals}`;
}

export function CurrencyInput(props: Props) {
  const { readOnly, TextFieldProps } = props;
  const [textValue, setTextValue] = useState<string>('');

  /**
   * Update value when updated from the outside
   */
  useEffect(() => {
    setTextValue(numericValueToText(props.value));
  }, [props.value]);

  const readonlyProps = useMemo<TextFieldProps>(() => {
    if (!readOnly) {
      return {};
    }
    return {
      hiddenLabel: true,
      variant: 'filled',
      InputProps: { readOnly: true },
    };
  }, [readOnly]);

  const CurrencyTextField = useMemo(() => {
    return function CurrencyTextField(props: TextFieldProps) {
      return (
        <TextField
          {...props}
          variant="outlined"
          size="small"
          {...readonlyProps}
          InputProps={{
            ...readonlyProps.InputProps,
            endAdornment: <InputAdornment position="end">€</InputAdornment>,
            ...TextFieldProps?.InputProps,
          }}
          {...TextFieldProps}
        />
      );
    };
  }, [props.TextFieldProps, readonlyProps]);

  return (
    <CurrencyInputField
      id={props.id}
      name={props.name}
      placeholder={props.placeholder}
      readOnly={props.readOnly}
      disabled={props.disabled}
      value={textValue}
      decimalsLimit={2}
      ref={props.innerRef}
      onValueChange={(value) => setTextValue(value ?? '')}
      onBlur={() => props.onChange(textValueToNumeric(textValue))}
      intlConfig={{ locale: 'fi-FI' }}
      customInput={CurrencyTextField}
    />
  );
}
