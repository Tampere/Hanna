import React from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@src/App';

document.addEventListener('DOMContentLoaded', async () => {
  const appDiv = document.getElementById('app');
  if (appDiv) {
    createRoot(appDiv).render(<App />);
  }
});
