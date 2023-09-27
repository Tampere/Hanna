import { InputAdornment, InputBase, InputProps } from '@mui/material';
import { useEffect, useState } from 'react';
import CurrencyInputField from 'react-currency-input-field';

import { numericValueToText, textValueToNumeric } from '@frontend/components/forms/CurrencyInput';

interface Props {
  value: number | null;
  commitValue: (value: number) => void;
}

function CustomInput(props: InputProps) {
  return (
    <InputBase
      {...props}
      autoFocus
      value={props.value}
      inputProps={{ style: { textAlign: 'right', fontSize: 12 } }}
      endAdornment={<InputAdornment position="end">€</InputAdornment>}
    />
  );
}

export function CurrencyEdit({ value, commitValue }: Props) {
  const [textValue, setTextValue] = useState<string>('');

  useEffect(() => {
    setTextValue(numericValueToText(value));
  }, [value]);

  return (
    <CurrencyInputField
      autoFocus
      value={textValue}
      onValueChange={(value) => setTextValue(value ?? '')}
      onKeyDown={(e) => {
        if (e.code === 'Enter' || e.code === 'Tab') {
          commitValue(textValueToNumeric(textValue) ?? 0);
        }
      }}
      customInput={CustomInput}
    />
  );
}
