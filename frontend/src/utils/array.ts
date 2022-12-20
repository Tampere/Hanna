/**
 * Get an array including all integer numbers within the given numeric range
 * @param start Start of the range (inclusive)
 * @param end End of the range (inclusive)
 * @returns All integer numbers within the range
 */
export function getRange(start: number, end: number) {
  return new Array(end - start + 1).fill(null).map((_, index) => start + index);
}
