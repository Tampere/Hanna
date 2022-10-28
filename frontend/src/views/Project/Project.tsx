import { Button } from '@mui/material';
import React from 'react';

import { client } from '@frontend/client';

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
      <div>Kartta</div>
    </div>
  );
}
