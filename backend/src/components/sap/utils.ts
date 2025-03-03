export function yearRange(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => i + start);
}
