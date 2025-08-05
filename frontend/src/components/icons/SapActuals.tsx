import { SvgIcon, Tooltip, css } from '@mui/material';

import { theme } from '@frontend/Layout';
import { formatCurrency } from '@frontend/components/forms/CurrencyInput';
import { useTranslations } from '@frontend/stores/lang';

export function SapActualsIcon({ sapActual }: { sapActual: number | null }) {
  const tr = useTranslations();
  return (
    <Tooltip
      title={`${formatCurrency(sapActual || 0)} (${tr('sapActualsOnHover')})`}
      placement="right"
      arrow
    >
      <SvgIcon
        css={css`
          height: 32px;
          width: 32px;
          /* Add the hover effect here */
          &:hover .icon-path {
            fill: ${theme.palette.primary.main}; /* Change to your desired hover color */
          }
        `}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className="icon-path"
          d="M4.91425 16H12.0656L19.0645 9H4.91425V16Z"
          fill="#758DB8"
          stroke="758DB8"
          strokeWidth="2"
        />
      </SvgIcon>
    </Tooltip>
  );
}
