import dayjs from 'dayjs';
import { Locator } from 'playwright';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

/**
 * MUI-X date pickers don't have a masked input anymore, so formatted dates cannot be filled.
 * This function converts the original date to a zero-padded date without separators, and
 * then types it into the field one character at a time.
 * @param locator Locator
 * @param date Date in the visible format
 */
export async function fillDatePickerValue(locator: Locator, date: string) {
  const inputString = dayjs(date, 'D.M.YYYY').format('DDMMYYYY');
  await locator.focus();
  await locator.type(inputString);
}

/**
 * MUI-X date pickers contain invisible control characters in their value.
 * This function strips them and returns the actual visible value of the picker.
 * @param locator Locator
 * @returns Visible date picker value
 */
export async function getDatePickerValue(locator: Locator) {
  const value = await locator.inputValue();
  return value.replace(/\u200e|\u2066|\u2067|\u2068|\u2069/g, '');
}
