import { SvgIcon, SvgIconProps } from '@mui/material';

export function Complete(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
      >
        <path d="M1 5.25L4.5 8.75L10 3.25" stroke="#4BA226" strokeWidth="2" />
      </svg>
    </SvgIcon>
  );
}
