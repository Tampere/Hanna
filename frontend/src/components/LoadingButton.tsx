import { Button, ButtonProps, CircularProgress, Tooltip, css } from '@mui/material';

export function LoadingButton({ loading, ...buttonProps }: ButtonProps & { loading: boolean }) {
  return (
    <Tooltip
      title={buttonProps.title}
      className={buttonProps.className}
      css={css`
        width: fit-content;
      `}
    >
      <span>
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
      </span>
    </Tooltip>
  );
}
