function getYAxisScaleValue(num: number) {
  if (num === 0) return num;
  const exponent = Math.floor(Math.log10(Math.abs(num)));
  return num < 0
    ? Math.floor(num / 10 ** exponent) * 10 ** exponent
    : Math.ceil(num / 10 ** exponent) * 10 ** exponent;
}

/** Returns rounded Y-axis min and max values
 * and makes sure that these values are not too close to origin axis. */
export function getYAxisScale(values: { max: number; min: number }) {
  const maxDatasetYValue = getYAxisScaleValue(values.max);
  const minDatasetYValue = getYAxisScaleValue(values.min);

  return {
    max: maxDatasetYValue > 0 ? Math.max(Math.abs(minDatasetYValue) / 2, maxDatasetYValue) : 0,
    min:
      minDatasetYValue < 0 ? Math.min(Math.abs(maxDatasetYValue) / -2, minDatasetYValue * 1.5) : 0,
  };
}
