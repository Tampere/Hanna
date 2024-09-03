import { SerializedStyles, css } from '@emotion/react';
import { Check } from '@mui/icons-material';
import { Checkbox, FormControlLabel } from '@mui/material';
import { PropsWithChildren } from 'react';

interface CheckBoxBorderIconProps extends PropsWithChildren {
  disabled?: boolean;
}

function CheckBoxBorderIcon(props: CheckBoxBorderIconProps) {
  return (
    <span
      css={(theme) => css`
        ${!props.disabled &&
        `input:focus ~ & {
          border-color: ${theme.palette.primary.main};
          box-shadow: 0 0 0 0.5px rgb(0 0 0 / 20%);
        }
        input:hover ~ & {
          border-color: ${theme.palette.primary.main};
          box-shadow: 0 0 0 0.5px rgb(0 0 0 / 20%);
        }`}
        width: 24px;
        height: 24px;
        border-radius: 4px;
        border: 0.5px solid #c4c4c4;
        display: flex;
        justify-content: center;
        align-items: center;
      `}
    >
      {props.children}
    </span>
  );
}

interface Props {
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  checked: boolean;
  label: string;
  cssProp?: SerializedStyles;
  disabled?: boolean;
}

export function FormCheckBox({ onChange, checked, label, cssProp, disabled = false }: Props) {
  return (
    <FormControlLabel
      {...(cssProp && { css: cssProp })}
      control={
        <Checkbox
          disabled={disabled}
          checked={checked}
          onChange={onChange}
          disableRipple
          icon={<CheckBoxBorderIcon />}
          checkedIcon={
            <CheckBoxBorderIcon disabled={disabled}>
              <Check
                css={(theme) => css`
                  font-size: 18px;
                  color: ${disabled ? '#c4c4c4' : theme.palette.primary.dark};
                `}
              />
            </CheckBoxBorderIcon>
          }
          css={css`
            background-color: #fff;
          `}
        />
      }
      label={label}
    />
  );
}
