import { css } from '@emotion/react';
import { Divider, Paper, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

interface Props {
  subject: string;
  html: string;
}

export function MailPreview({ subject, html }: Props) {
  const [iframeHeight, setIframeHeight] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) {
      return;
    }
    // When content changes, force reload the iframe to rerun onLoad
    iframeRef.current.src += '';
  }, [html]);

  return (
    <Paper>
      <Typography variant="h6" sx={{ m: 1 }}>
        {subject}
      </Typography>
      <Divider />
      <iframe
        ref={iframeRef}
        srcDoc={html}
        css={css`
          width: 100%;
          border: none;
          height: ${iframeHeight}px;
        `}
        onLoad={() => {
          // Get the <html> height (vie parentElement) to take the body's margin into account
          const height = iframeRef.current?.contentDocument?.body.parentElement?.offsetHeight ?? 0;
          setIframeHeight(height);
        }}
      />
    </Paper>
  );
}
