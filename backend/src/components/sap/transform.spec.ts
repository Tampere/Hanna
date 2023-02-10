import { describe, expect, it } from 'vitest';

import { transformActuals } from './transform';

function createItem(date: string, amount: string, objectType: string, entryType: string) {
  return {
    BELNR: '0001',
    OBJ_TXT: 'Test',
    PSPID: '12345',
    POSID: '12345',
    AUFNR: '12345',
    VORNR: '1000',
    GJAHR: '2020',
    BLDAT: date,
    BUDAT: date,
    CPUDT: date,
    OBART: objectType,
    TWAER: 'EUR',
    WTGBTR: amount,
    BEKNZ: entryType,
  };
}

const actuals = {
  ACTUALS: {
    item: [
      // test edge cases where amount can be positive and negative. It can have
      // a decimal point which is 1 or 2 digits. Negative entries have 'NV' objectType and
      // 'A' entryType. Positive entries have 'PR' objectType and 'S' entryType.
      createItem('2020-01-01', '1', 'PR', 'S'),
      createItem('2020-02-01', '-1', 'NV', 'A'),
      createItem('2020-03-01', '1.5', 'PR', 'S'),
      createItem('2020-04-01', '-1.5', 'NV', 'A'),
      createItem('2020-05-01', '1.00', 'PR', 'S'),
      createItem('2020-06-01', '-1.00', 'NV', 'A'),
      createItem('2020-07-01', '0.0', 'PR', 'S'),
      createItem('2020-07-01', '0.00', 'PR', 'S'),
      createItem('2020-07-01', '0', 'PR', 'S'),
    ],
  },
};

describe('transformActuals', () => {
  it('should transform actuals', () => {
    const transformedActuals = transformActuals(actuals);

    expect(transformedActuals[0].valueInCurrencySubunit).toBe(100);
    expect(transformedActuals[1].valueInCurrencySubunit).toBe(-100);
    expect(transformedActuals[2].valueInCurrencySubunit).toBe(150);
    expect(transformedActuals[3].valueInCurrencySubunit).toBe(-150);
    expect(transformedActuals[4].valueInCurrencySubunit).toBe(100);
    expect(transformedActuals[5].valueInCurrencySubunit).toBe(-100);
    expect(transformedActuals[6].valueInCurrencySubunit).toBe(0);
    expect(transformedActuals[7].valueInCurrencySubunit).toBe(0);
    expect(transformedActuals[8].valueInCurrencySubunit).toBe(0);
  });
});
