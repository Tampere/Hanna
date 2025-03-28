import { SerializedStyles } from '@emotion/react';
import { css } from '@mui/material';

const baseStyle = css`
  border-radius: 5px;
  height: 5px;
`;

interface Props {
  fillPrecentage: number;
  cssProp?: SerializedStyles;
}

export function ProgressBar({ fillPrecentage, cssProp }: Props) {
  const usedPrecentage = fillPrecentage > 100 ? (100 / fillPrecentage) * 100 : fillPrecentage;

  return (
    <div
      css={css`
        ${cssProp}
        ${baseStyle}
        margin: 0 1rem 0 0;
        width: min(40em, 100%);
        flex: none;
        display: flex;
        background-color: #fff;
        gap: 2px;
      `}
    >
      <span
        className="used-amount"
        css={css`
          ${baseStyle}
          border-radius: 5px 0 0 5px;
          width: ${usedPrecentage}%;
          background-color: #105da4;
        `}
      />

      {fillPrecentage < 100 && (
        <span
          className="remaining-amount"
          css={css`
            ${baseStyle}
            border-radius: 0 5px 5px 0;
            width: ${100 - fillPrecentage}%;
            background-color: #c0cbdd;
          `}
        />
      )}
      {fillPrecentage > 100 && (
        <span
          className="exceeding-amount"
          css={css`
            ${baseStyle}
            border-radius: 0 5px 5px 0;
            width: ${100 - usedPrecentage}%;
            background-color: #e46c29;
          `}
        />
      )}
    </div>
  );
}
