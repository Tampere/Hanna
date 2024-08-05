import { init } from 'server-text-width';

import { translations } from '@shared/language';

type SupportedFontName = 'Calibri';
type SupportedFontSize = '12px';
type SupportedFontWeight = 'normal' | 'bold';

type LookupTableKey = `${SupportedFontName}|${SupportedFontSize}|${SupportedFontWeight}|0`;

// Pre-calculated lookup tables for the supported fonts
const lookupTable: { [key in LookupTableKey]: string } = {
  'Calibri|12px|normal|0':
    'AAFUFUFUFUFUFUFUAADnDnDnDnDnFUFUFUFUFUFUFUFUFUFUFUFUFUFUFUAAFUFUDnFNGaH+IHLcK6DiE2E2H+H+D/E5ECGLIHIHIHIHIHIHIHIHIHIHESESH+H+H+HaOTJQItIiJ2H0HWKGJ+ECFGIUGuNrKVKmIRKxIsHWHzKRJFOPITHzHfE6GLE6H+H+EqHqIaGxIaH9E4HiIaDrD1HRDrMyIaIcIaIaFlGQFXIaHOLcG7HPGUFCHXFCH+AAI5QAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQADnFNH+IHH+IHH+H+GSNWGcIMH+AAIHGTFbH+FYFWErIzJYECE6D8GwIMKLKvKzHaJQJQJQJQJQJQMNIiH0H0H0H0ECECECECJ/KVKmKmKmKmKmH+KnKRKRKRKRHzIRIcHqHqHqHqHqHqMXGxH9H9H9H9DrDrDrDrIaIaIcIcIcIcIcH+IeIaIaIaIaHPIaHP',
  'Calibri|12px|bold|0':
    'AAFUFUFUFUFUFUFUAADnDnDnDnDnFUFUFUFUFUFUFUFUFUFUFUFUFUFUFUAAFUFUDnFNHBH+IHLqLRDvE/E/H+H+EIE5ERG4IHIHIHIHIHIHIHIHIHIHEaEaH+H+H+HaOYJsI+IeKFHzHWKMKGERFTIwGxN/KiK0IhK+JAHkH7KcJdOgI0IUHpFMG4FMH+H+EzH5IlGsIlIDFEHlIlD7EFHrD7NBIlImIlIlFsGYFjIlHkL7HWHlGXFgHmFgH+AAJTQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQADnFNH+IHH+IHH+H+GoNWGqInH+AAIHGPFeH+FaFYE0JBJkESE2ECG9InKhLDLOHaJsJsJsJsJsJsMaIeHzHzHzHzERERERERKOKiK0K0K0K0K0H+K5KcKcKcKcIUIhI4H5H5H5H5H5H5MZGsIDIDIDIDD7D7D7D7IlIlImImImImImH+ItIlIlIlIlHlIlHl',
};

const { getTextWidth } = init(lookupTable);
// For dates, approximate the width with a placeholder
const dummyDate = translations.fi['date.format.placeholder'];

export function calculateTextWidth({
  text,
  fontName,
  fontSize,
  fontWeight,
}: {
  text: string | number | Date;
  fontName: SupportedFontName;
  fontSize: SupportedFontSize;
  fontWeight: SupportedFontWeight;
}) {
  const textValue = text instanceof Date ? dummyDate : String(text);

  // Calculate the width for each line and return the longest one
  const lengths = textValue.split(/\n/).map((line) =>
    getTextWidth(line, {
      fontName,
      fontWeight,
      fontSize,
    }),
  );

  return Math.max(...lengths);
}
