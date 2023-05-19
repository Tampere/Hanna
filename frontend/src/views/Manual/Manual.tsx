import { Box, CssBaseline, css } from '@mui/material';
import 'github-markdown-css/github-markdown-light.css';
import { useRef } from 'react';
import { useLocation } from 'react-router';

import { useOnContentLoaded } from '@frontend/utils/useOnContentLoaded';

import { ReactComponent as ManualContent } from './fi.md';
import './manual.css';

export function Manual() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { hash } = useLocation();

  function scrollToLocation() {
    const id = hash.replace('#', '');
    document.getElementById(id)?.scrollIntoView();
  }

  // When all the content (images included) is loaded, scroll to the current anchor URL (if defined)
  useOnContentLoaded(containerRef, () => {
    scrollToLocation();
  });

  return (
    <CssBaseline>
      <Box
        ref={containerRef}
        css={css`
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
        `}
        className="markdown-body"
      >
        <ManualContent />
      </Box>
    </CssBaseline>
  );
}
