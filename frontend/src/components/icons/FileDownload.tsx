export function FileDownload({ disabled = false }: { disabled?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        opacity="0.3"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6 4H14V8H18V20H6V4ZM11 10H13V14H16L12 18L8 14H11V10Z"
        fill="#294578"
        style={{
          fill: '#294578',
          color: 'color(display-p3 0.1608 0.2706 0.4706)',
          fillOpacity: disabled ? 0.3 : 1,
        }}
      />
      <path
        d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H14V8H18V20Z"
        fill="#294578"
        style={{
          fill: '#294578',
          color: 'color(display-p3 0.1608 0.2706 0.4706)',
          fillOpacity: disabled ? 0.3 : 1,
        }}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13 10H11V14H8L12 18L16 14H13V10Z"
        fill="#294578"
        style={{
          fill: '#294578',
          color: 'color(display-p3 0.1608 0.2706 0.4706)',
          fillOpacity: disabled ? 0.3 : 1,
        }}
      />
    </svg>
  );
}
