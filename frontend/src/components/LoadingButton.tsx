import { Button, ButtonProps, CircularProgress, css } from '@mui/material';

export function LoadingButton({ loading, ...buttonProps }: ButtonProps & { loading: boolean }) {
  return (
    <Button disabled={loading} {...buttonProps}>
      {buttonProps.children}
      {loading && (
        <CircularProgress
          size={20}
          css={css`
            position: absolute;
          `}
        />
      )}
    </Button>
  );
}
