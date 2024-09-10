import { MenuItem, Select, SelectChangeEvent, css } from '@mui/material';
import { useAtom } from 'jotai';

import {
  SelectedProjectColorCode,
  colorPatternSelections,
  selectedFeatureColorCodeAtom,
} from '@frontend/stores/map';

export function ColorPatternSelect() {
  const [selectedFeatureColorCode, setSelectedFeatureColorCode] = useAtom(
    selectedFeatureColorCodeAtom,
  );

  function handleChange(event: SelectChangeEvent) {
    setSelectedFeatureColorCode(
      colorPatternSelections.find(
        (selection) => selection.title === event.target.value,
      ) as SelectedProjectColorCode,
    );
  }

  return (
    <Select
      css={css`
        background-color: white;
        width: 220px;
        height: 40px;
        position: absolute;
        top: 1rem;
        right: 0.5rem;
        z-index: 202;
      `}
      onChange={handleChange}
      value={selectedFeatureColorCode.title}
    >
      {colorPatternSelections.map((selection, index) => (
        <MenuItem key={`${index}-${selection.title}`} value={selection.title}>
          {selection.title}
        </MenuItem>
      ))}
    </Select>
  );
}
