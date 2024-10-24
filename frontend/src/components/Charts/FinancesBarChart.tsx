import { css } from '@mui/material';
import {
  BarPlot,
  ChartsReferenceLine,
  ChartsXAxis,
  ChartsYAxis,
  ResponsiveChartContainer,
} from '@mui/x-charts';

import { useTranslations } from '@frontend/stores/lang';

interface Props {
  colors: string[];
  dataLabels: string[];
  barData: number[];
  amount: number | null;
  yAxisDimensions?: { min: number; max: number };
}
const labelColor = '#525252';

export function FinancesBarChart({ colors, barData, dataLabels, amount, yAxisDimensions }: Props) {
  const tr = useTranslations();

  const refValue = amount && amount > 0 && amount / dataLabels.length;

  return (
    <ResponsiveChartContainer
      height={220}
      css={css`
        padding: 1px; // Dirty trick to display ticklabels
        & .MuiLineElement-root {
          stroke-dasharray: 6;
          stroke-width: 1;
        }
        & .MuiChartsAxis-tickLabel.MuiChartsAxis-tickLabel {
          font-size: 12px;
          fill: ${labelColor};
        }
        & .MuiBarLabel-series-bar-data {
          fill: #fff;
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
          min: yAxisDimensions?.min && yAxisDimensions.min < 0 ? yAxisDimensions.min : 0,
          max: yAxisDimensions?.max ?? Math.max(200000, Math.max(...barData)),
        },
      ]}
    >
      <BarPlot
        barLabel={(item) => {
          if (!item.value) return '';
          const roundedValue = Math.round(item.value);
          if (roundedValue >= 1 * 10 ** 6) {
            return new Intl.NumberFormat('fi-FI').format(Math.round(roundedValue / 100) / 10) + 'k'; // Thousands rounded to one decimal
          }
          return new Intl.NumberFormat('fi-FI').format(roundedValue);
        }}
      />{' '}
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

            const formattedText = new Intl.NumberFormat('fi-FI').format(
              Number(text.split(',').join('')),
            );

            return <text {...restProps}>{formattedText}</text>;
          },
        }}
        tickSize={4}
        tickInterval={
          yAxisDimensions
            ? [
                Math.min(0, yAxisDimensions.min),
                Math.min(0, yAxisDimensions.min) / 2,
                yAxisDimensions.max,
                yAxisDimensions.max / 2,
              ]
            : 'auto'
        }
      />
    </ResponsiveChartContainer>
  );
}
