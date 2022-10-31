import { Layers } from '@mui/icons-material';
import {
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

interface Props {
  onLayerChange: (layerId: string) => void;
}

export function LayerDrawer({ onLayerChange }: Props) {
  const [selectedLayerId, setSelectedLayerId] = useState<string>('opaskartta');

  // function changeLayer(event: SelectChangeEvent) {
  //   setSelectedLayerId(event.target.value as string);
  //   onLayerChange(event.target.value as string);
  // }

  useEffect(() => {
    onLayerChange(selectedLayerId);
  }, [selectedLayerId]);

  return (
    <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', zIndex: 999 }}>
      <IconButton size="large" color="primary">
        <Layers />
      </IconButton>
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">Karttatasot</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={selectedLayerId}
          label="layer"
          onChange={(event: SelectChangeEvent) => {
            console.log(event.target.value);
            setSelectedLayerId(event.target.value as string);
          }}
        >
          <MenuItem value={'opaskartta'}>Opaskartta</MenuItem>
          <MenuItem value={'kantakartta'}>Kantakartta</MenuItem>
          <MenuItem value={'ilmakuva'}>Ilmakuva</MenuItem>
          <MenuItem value={'asemakaava'}>Asemakaava</MenuItem>
        </Select>
      </FormControl>
    </div>
  );
}
