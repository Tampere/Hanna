import { Input, InputAdornment, InputBase, TextField, TextFieldProps } from '@mui/material';
import { Ref, useEffect, useMemo, useState } from 'react';
import CurrencyInputField from 'react-currency-input-field';

interface Props {
  value: number | null;
  id?: string;
  name?: string;
  innerRef?: Ref<HTMLInputElement>;
  onChange?: (value: number | null) => void;
  placeholder?: string;
  editing?: boolean;
  disabled?: boolean;
  TextFieldProps?: TextFieldProps;
  readOnly?: boolean;
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
  const { editing, TextFieldProps } = props;
  const [textValue, setTextValue] = useState<string>('');

  /**
   * Update value when updated from the outside
   */
  useEffect(() => {
    setTextValue(numericValueToText(props.value));
  }, [props.value]);

  const editingProps = useMemo<TextFieldProps>(() => {
    if (!editing) {
      return {};
    }
    return {
      hiddenLabel: true,
      variant: 'filled',
      InputProps: { readOnly: true },
    };
  }, [editing]);

  const FormattedCurrencyField = useMemo(() => {
    return function FormattedCurrencyField(props: TextFieldProps) {
      return (
        <InputBase
          value={props.value}
          sx={{ pl: '12px', pt: '8px', pb: '8px' }}
          inputProps={{ style: { textAlign: 'right' }, tabIndex: -1 }}
          endAdornment={<InputAdornment position="end">€</InputAdornment>}
        />
      );
    };
  }, []);

  const CurrencyTextField = useMemo(() => {
    return function CurrencyTextField(props: TextFieldProps) {
      return (
        <TextField
          {...props}
          variant="outlined"
          size="small"
          {...editingProps}
          inputProps={{ style: { textAlign: 'right' } }}
          InputProps={{
            ...editingProps.InputProps,
            endAdornment: <InputAdornment position="end">€</InputAdornment>,
            ...TextFieldProps?.InputProps,
          }}
          {...TextFieldProps}
        />
      );
    };
  }, [props.TextFieldProps, editingProps]);

  return (
    <CurrencyInputField
      id={props.id}
      name={props.name}
      placeholder={props.placeholder}
      readOnly={props.editing}
      disabled={props.disabled}
      value={textValue}
      decimalsLimit={2}
      ref={props.innerRef}
      onValueChange={(value) => setTextValue(value ?? '')}
      onBlur={() => props.onChange?.(textValueToNumeric(textValue))}
      intlConfig={{ locale: 'fi-FI' }}
      customInput={props?.readOnly ? FormattedCurrencyField : CurrencyTextField}
    />
  );
}
