import { Box, Chip, Typography, css } from '@mui/material';

import { useTranslations } from '@frontend/stores/lang';
import { useCodes } from '@frontend/utils/codes';

export const committeeColors = {
  '01': '#286213',
  '02': '#A35905',
  '03': '#0044C0',
  '04': '#D4A017',
  default: '#00000014',
};

function isCommitteeColorKey(key: string): key is keyof typeof committeeColors {
  return Object.keys(committeeColors).includes(key);
}

interface ChipProps {
  label: string;
  labelColor?: string;
  chipColor: string;
  handleClick: () => void;
}

function CommitteeChip({ label, labelColor, chipColor, handleClick }: ChipProps) {
  return (
    <Chip
      label={label}
      css={css`
        height: 24px;
        background-color: ${chipColor};
        color: ${labelColor ?? '#fff'};
        :hover {
          opacity: 0.75;
          background-color: ${chipColor};
        }
      `}
      onClick={handleClick}
    />
  );
}

interface Props {
  selectedCommittees: string[];
  availableCommittees: string[];
  setSelectedCommittees: React.Dispatch<React.SetStateAction<string[]>>;
}

export function CommitteeSelection({
  selectedCommittees,
  setSelectedCommittees,
  availableCommittees,
}: Props) {
  const committeeCodes = useCodes('Lautakunta');
  const tr = useTranslations();

  if (availableCommittees.length === 0) {
    return null;
  }

  if (availableCommittees.length === 1) {
    return (
      <Typography
        css={css`
          font-size: 13px;
          color: #525252;
          margin: 0.5rem 0 0.5rem 8px;
        `}
      >
        Lautakunta: {committeeCodes.get(availableCommittees[0])?.fi}
      </Typography>
    );
  }

  return (
    <Box
      css={css`
        position: sticky;
        top: 0;
        left: 0;
        background-color: #fff;
        z-index: 1;
        padding-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 1rem;
      `}
    >
      <Typography
        css={css`
          font-size: 13px;
          color: #525252;
        `}
      >
        {tr('budgetTable.committeeChip.title')}
      </Typography>
      {availableCommittees.map((committeeKey) => {
        const committeeColor = isCommitteeColorKey(committeeKey)
          ? committeeColors[committeeKey]
          : committeeColors.default;
        return (
          <CommitteeChip
            key={committeeKey}
            label={committeeCodes.get(committeeKey)?.fi.replace(/lautakunta/g, ' ') ?? ''}
            labelColor={selectedCommittees.includes(committeeKey) ? '#fff' : '#000'}
            chipColor={
              selectedCommittees.includes(committeeKey) ? committeeColor : committeeColors.default
            }
            handleClick={() =>
              setSelectedCommittees((prev) =>
                prev.includes(committeeKey)
                  ? prev.filter((c) => c !== committeeKey)
                  : [...prev, committeeKey],
              )
            }
          />
        );
      })}
      {selectedCommittees.length < availableCommittees.length && (
        <CommitteeChip
          label={tr('budgetTable.committeeChip.all')}
          labelColor="#000"
          chipColor={committeeColors.default}
          handleClick={() => setSelectedCommittees(availableCommittees)}
        />
      )}
    </Box>
  );
}
