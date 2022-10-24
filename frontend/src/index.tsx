import React from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@frontend/App';
import { client } from '@frontend/client';

document.addEventListener('DOMContentLoaded', async () => {
  const res = await client.project.getProjects.query({ asdf: 'adsf' });
  console.log(res);
  const appDiv = document.getElementById('app');
  if (appDiv) {
    createRoot(appDiv).render(<App />);
  }
});
