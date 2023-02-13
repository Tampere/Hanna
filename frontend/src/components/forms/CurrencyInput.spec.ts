import { describe, expect, it } from 'vitest';

import { numericValueToText, textValueToNumeric } from './CurrencyInput';

describe('CurrencyInput', () => {
  it('should convert numeric value to text', () => {
    expect(numericValueToText(100)).toBe('1.00');
    expect(numericValueToText(150)).toBe('1.50');
    expect(numericValueToText(0)).toBe('0.00');
    expect(numericValueToText(-100)).toBe('-1.00');
    expect(numericValueToText(-199)).toBe('-1.99');
  });

  it('should convert text value to numeric', () => {
    expect(textValueToNumeric('1.00')).toBe(100);
    expect(textValueToNumeric('1.50')).toBe(150);
    expect(textValueToNumeric('0.00')).toBe(0);
  });
});
