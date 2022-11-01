import { Layers } from '@mui/icons-material';
import { IconButton, MenuItem, Tooltip, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';

import { mapOptions } from './mapOptions';

interface Props {
  onLayerChange: (layerId: string) => void;
}

export function LayerDrawer({ onLayerChange }: Props) {
  const [selectedLayerId, setSelectedLayerId] = useState<string>('opaskartta');
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    onLayerChange(selectedLayerId);
  }, [selectedLayerId]);

  return (
    <div
      style={{
        position: 'absolute',
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Tooltip title="Karttatasot">
        <IconButton
          style={{ position: 'absolute', bottom: '1rem', left: '1rem', zIndex: '9999' }}
          size="large"
          color="primary"
          onClick={() => setDrawerOpen((drawerOpen) => !drawerOpen)}
        >
          <Layers />
        </IconButton>
      </Tooltip>
      <div
        style={{
          height: 'calc(100%)',
          width: '200px',
          backgroundColor: 'white',
          zIndex: drawerOpen ? 1000 : 0,
          opacity: drawerOpen ? 0.95 : 0,
          transition: 'opacity 0.15s ease-in-out',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '2px 1px 4px #9c9c9c',
          borderTop: '1px solid #e8e8e8',
          borderBottom: '1px solid #e8e8e8',
          borderTopRightRadius: '2px 2px',
          borderBottomRightRadius: '2px 2px',
        }}
      >
        {mapOptions.baseMaps.map((baseMap, index) => (
          <MenuItem
            key={`basemap-${index}`}
            onClick={() => setSelectedLayerId(baseMap.id)}
            style={{
              backgroundColor: baseMap.id === selectedLayerId ? '#22437b' : '',
              color: baseMap.id === selectedLayerId ? 'white' : '',
            }}
          >
            <Typography>{baseMap.name}</Typography>
          </MenuItem>
        ))}
      </div>
    </div>
  );
}
