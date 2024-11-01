import { css } from '@mui/material';
import {
  BarLabel,
  BarPlot,
  ChartsLegend,
  ChartsReferenceLine,
  ChartsXAxis,
  ChartsYAxis,
  DefaultChartsLegend,
  ResponsiveChartContainer,
  useDrawingArea,
  useYScale,
} from '@mui/x-charts';
import { ScaleLinear } from 'd3-scale';
import { translate } from 'ol/transform';

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
  totalAmount: number | null;
  yAxisScale?: { min: number; max: number };
}

export function FinancesBarChart({ colors, barData, dataLabels, totalAmount, yAxisScale }: Props) {
  const tr = useTranslations();

  const refValue = totalAmount && totalAmount > 0 && totalAmount / dataLabels.length;

  function formatAmount(amount: number) {
    if (amount >= 1 * 10 ** 6) {
      return new Intl.NumberFormat('fi-FI').format(Math.round(amount / 100) / 10) + 'k'; // Thousands rounded to one decimal
    }
    return new Intl.NumberFormat('fi-FI').format(amount);
  }

  function getTickInterval() {
    if (!yAxisScale) return 'auto';

    if (yAxisScale.min == 0) {
      return [0, yAxisScale.max / 2, yAxisScale.max];
    }
    if (yAxisScale.max == 0) {
      return [0, yAxisScale.min / 2, yAxisScale.min];
    }

    const interval = Math.max(Math.abs(yAxisScale.max), Math.abs(yAxisScale.min)) / 2;
    return [
      0,
      yAxisScale.min,
      yAxisScale.min + interval,
      yAxisScale.max - interval,
      yAxisScale.max,
    ];
  }

  return (
    <ResponsiveChartContainer
      height={240}
      css={css`
        padding: 7px; // Dirty trick to display ticklabels
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
          ...(yAxisScale && { min: yAxisScale.min, max: yAxisScale.max }),
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
        <>
          <ChartsReferenceLine
            y={refValue}
            labelAlign="end"
            lineStyle={{ stroke: '#4BA226', strokeWidth: 1, strokeDasharray: '6' }}
          />
          <ChartsLegend
            slots={{
              legend: () => {
                const { width } = useDrawingArea();

                return (
                  <g transform={`translate(${width - 160}, 40)`}>
                    <line
                      x1="50"
                      y1="-3"
                      x2="80"
                      y2="-3"
                      style={{ stroke: '#4BA226', strokeWidth: 1, strokeDasharray: '6' }}
                    />
                    <text x={90} style={{ fontSize: 12, fill: labelColor }}>
                      {tr('financesChart.averageLineLabel')}
                    </text>
                  </g>
                );
              },
            }}
          />
        </>
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
        tickInterval={getTickInterval()}
      />
      {yAxisScale && yAxisScale.min < 0 && yAxisScale.max > 0 && <OriginAxis />}
    </ResponsiveChartContainer>
  );
}
