import { KeyboardDoubleArrowUp } from '@mui/icons-material';
import { Fab, Zoom, css } from '@mui/material';
import { useEffect, useState } from 'react';

interface Props {
  element: HTMLElement | null;
}

export function BackToTopButton({ element }: Props) {
  const [isVisible, setIsVisible] = useState(false);

  function handleScroll() {
    if (element) {
      if (element.scrollTop === 0) {
        setIsVisible(false);
      } else if (element.scrollTop > 0 && !isVisible) {
        setIsVisible(true);
      }
    }
  }

  useEffect(() => {
    element?.addEventListener('scroll', handleScroll);
    return () => element?.removeEventListener('scroll', handleScroll);
  }, [element]);

  if (!element) {
    return null;
  }

  return (
    <Zoom in={isVisible} timeout={200}>
      <Fab
        size="small"
        variant="circular"
        onClick={() => {
          if (element) {
            element.scrollTo({ top: 0, behavior: 'smooth' });
            setIsVisible(false);
          }
        }}
        css={(theme) => css`
          display: flex;
          justify-content: center;
          opacity: 0.7;
          background-color: white;
          border: solid ${theme.palette.primary.main};
          color: black;
          :hover {
            color: white;
            background-color: ${theme.palette.primary.main};
          }
        `}
      >
        <KeyboardDoubleArrowUp />
      </Fab>
    </Zoom>
  );
}
