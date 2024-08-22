export function Info({ fillColor = '#105DA4' }: { fillColor?: string }) {
  return (
    <svg width="5" height="21" viewBox="0 0 5 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M5 0H0V5H5V0ZM5 9H0V21H5V9Z"
        fill="#105DA4"
        style={{ fill: '#105DA4', color: 'color(display-p3 0.0627 0.3647 0.6431)', fillOpacity: 1 }}
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M5 0H0V5H5V0ZM5 9H0V21H5V9Z"
        fill="black"
        fill-opacity="0.2"
        style={{ fill: 'black', fillOpacity: 0.2 }}
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M5 0H0V5H5V0ZM5 9H0V21H5V9Z"
        fill={fillColor}
        style={{ fill: fillColor, fillOpacity: 1 }}
      />
    </svg>
  );
}
