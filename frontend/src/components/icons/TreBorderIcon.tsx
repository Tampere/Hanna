import { SvgIcon, css } from '@mui/material';

export function TreBorderIcon({
  text,
  textColor,
  fillColor,
  strokeColor,
}: {
  text: string;
  textColor: string;
  fillColor: string;
  strokeColor: string;
}) {
  return (
    <SvgIcon
      css={css`
        height: 80px;
        width: 80px;
      `}
      viewBox="0 0 108 155"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className="icon-path"
        d="M101.704 20.3861L85.7426 20.7261L82.2721 17.6007H80.1914L61.1061 2L52.3134 6.39383V15.4169L47.8025 18.5291L43.2942 27.8922V38.9945L46.414 42.7999L41.5576 55.6414L37.0467 55.2885L34.6166 58.0608L35.3115 74.3546L39.4756 87.536L39.8224 110.068L33.5762 111.114L29.7602 109.035L26.9846 110.774L23.8609 109.035L20.7371 112.5L13.1025 113.886L8.93973 117.011L5.816 112.853L2 111.467L2.34548 117.011L6.50827 120.477L4.77563 123.249L5.4679 125.328H9.9801L12.4076 130.886L21.0852 128.454L26.6365 130.533L29.7602 128.794L32.8839 130.533L31.1474 133.998L32.8839 135.045L33.5762 147.52L37.0467 150.292L54.7448 151.678L59.8328 153.418L65.3841 139.896L69.5482 133.998V124.295L75.4475 125.681L77.1828 124.295L76.1424 117.705L93.4924 87.8891L105.638 82.3315L99.5069 76.5516L102.629 69.6207L102.283 58.5184L99.5069 48.8153L106.448 42.5776L104.713 39.4522L101.704 20.3861Z"
        fill="#4BA226"
        stroke="white"
        style={{
          fill: fillColor ?? '#4BA226',
          fillOpacity: 1,
          stroke: strokeColor ?? 'white',
          strokeOpacity: 1,
        }}
        strokeWidth="2"
      />
      <text
        css={css`
          font-weight: 700;
          color: ${textColor};
        `}
        x={'70px'}
        y={'70px'}
        dominantBaseline="middle"
        textAnchor="middle"
      >
        {text}
      </text>
    </SvgIcon>
  );
}
