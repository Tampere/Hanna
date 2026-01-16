import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import type { Locator } from '@playwright/test';

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
  await locator.page().pause();
  await locator.focus();
  // TODO: Try to remove at some point. Now there is a need to press left arrow three times
  // due to potential playwright regression in focus handling with MUI date picker.
  for (let i = 0; i < 3; i++) {
    await locator.press('ArrowLeft');
  }
  await locator.type(inputString, { delay: 50 });
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
