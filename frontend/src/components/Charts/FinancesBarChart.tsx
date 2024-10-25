import { css } from '@mui/material';
import {
  BarLabel,
  BarPlot,
  ChartsReferenceLine,
  ChartsXAxis,
  ChartsYAxis,
  ResponsiveChartContainer,
  useDrawingArea,
  useYScale,
} from '@mui/x-charts';
import { ScaleLinear } from 'd3-scale';

import { useTranslations } from '@frontend/stores/lang';

const labelColor = '#525252';
const axisColor = 'rgba(0, 0, 0, 0.87)';

function OriginAxis() {
  const { left, width } = useDrawingArea();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const yAxisScale = useYScale() as ScaleLinear<any, any>;
  const yOrigin = yAxisScale(0);

  return (
    <path
      css={css`
        stroke-width: 0.5;
        stroke: ${axisColor};
        shape-rendering: crispEdges;
        fill: none;
        pointer-events: none;
      `}
      d={`M ${left} ${yAxisScale(yOrigin)} l ${width} 0`}
    />
  );
}

interface Props {
  colors: string[];
  dataLabels: string[];
  barData: number[];
  amount: number | null;
  yAxisDimensions?: { min: number; max: number };
}

export function FinancesBarChart({ colors, barData, dataLabels, amount, yAxisDimensions }: Props) {
  const tr = useTranslations();

  const refValue = amount && amount > 0 && amount / dataLabels.length;

  function formatAmount(amount: number) {
    if (amount >= 1 * 10 ** 6) {
      return new Intl.NumberFormat('fi-FI').format(Math.round(amount / 100) / 10) + 'k'; // Thousands rounded to one decimal
    }
    return new Intl.NumberFormat('fi-FI').format(amount);
  }

  const minDimension =
    yAxisDimensions?.min && yAxisDimensions.min < 0
      ? Math.min(yAxisDimensions.min, (yAxisDimensions.max / 2) * -1)
      : 0;
  const maxDimension = yAxisDimensions?.max ?? Math.max(200000, Math.max(...barData));

  return (
    <ResponsiveChartContainer
      height={220}
      css={css`
        padding: 5px; // Dirty trick to display ticklabels
        & .MuiLineElement-root {
          stroke-dasharray: 6;
          stroke-width: 1;
        }
        & .MuiChartsAxis-tickLabel.MuiChartsAxis-tickLabel {
          font-size: 12px;
          fill: ${labelColor};
        }
        & .MuiBarLabel-series-bar-data {
          font-size: 10px;
          overflow: hidden;
        }
      `}
      colors={colors}
      series={[{ data: barData, type: 'bar', id: 'bar-data' }]}
      xAxis={[
        {
          data: dataLabels,
          scaleType: 'band',
          id: 'x-axis-id',
        },
      ]}
      yAxis={[
        {
          data: dataLabels,
          scaleType: 'linear',
          id: 'y-axis-id',
          min: minDimension,
          max: maxDimension,
        },
      ]}
    >
      <BarPlot
        slots={{
          barLabel: (barLabelProps) => {
            if (!barLabelProps.children) {
              return null;
            }
            if (typeof barLabelProps.children === 'string') {
              // Content of barlabelProps.children is an object stringified in barLabel prop
              const { value, barHeight } = JSON.parse(barLabelProps.children);

              const yShift = value < 0 ? barHeight / 2 + 10 : -barHeight / 2 - 10;

              return (
                <BarLabel {...barLabelProps}>
                  <tspan y={yShift}>{formatAmount(value)}</tspan>
                </BarLabel>
              );
            }
          },
        }}
        barLabel={(item, context) => {
          return item.value
            ? // Stringify content to pass bar height to slot props
              JSON.stringify({ value: Math.round(item.value), barHeight: context.bar.height })
            : '';
        }}
      />
      {refValue && (
        <ChartsReferenceLine
          y={refValue}
          label={tr('financesChart.averageLineLabel')}
          labelAlign="end"
          lineStyle={{ stroke: '#4BA226', strokeWidth: 1, strokeDasharray: '6' }}
          labelStyle={{ fontSize: 12, fill: labelColor }}
        />
      )}
      <ChartsXAxis position="bottom" axisId="x-axis-id" tickPlacement="middle" tickSize={4} />
      <ChartsYAxis
        position="left"
        axisId="y-axis-id"
        slots={{
          axisTickLabel: (labelProps) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { text, ownerState, ...restProps } = labelProps;
            const normalizedText = text.replace(/−/g, '-');

            const formattedText = new Intl.NumberFormat('fi-FI').format(
              Number(normalizedText.split(',').join('')),
            );

            return <text {...restProps}>{formattedText}</text>;
          },
        }}
        tickSize={4}
        tickInterval={
          minDimension < 0
            ? [minDimension, minDimension / 2, 0, maxDimension / 2, maxDimension]
            : [0, maxDimension / 2, maxDimension]
        }
      />
      {minDimension < 0 && <OriginAxis />}
    </ResponsiveChartContainer>
  );
}
