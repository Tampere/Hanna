import { Button, Paper } from '@mui/material';
import React from 'react';

import { client } from '@frontend/client';
import { Map } from '@frontend/components/Map/Map';

export function Project() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr' }}>
      <div>
        Menu
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            client.project.create.mutate({ description: 'napista tehty', name: 'ui-testi' });
          }}
        >
          Luo uusi hanke
        </Button>
      </div>
      <Paper elevation={2} style={{ height: '600px' }}>
        <Map />
      </Paper>
    </div>
  );
}
