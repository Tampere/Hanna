import { Button, ButtonProps, CircularProgress, Tooltip, css } from '@mui/material';

export function LoadingButton({
  loading,
  title,
  ...buttonProps
}: ButtonProps & { loading: boolean }) {
  return (
    <Tooltip
      title={title}
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
