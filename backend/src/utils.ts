/**
 * Parses an optional string provided by hook form. If the string is empty, return null to be saved into database.
 * Otherwise return the string.
 */
export function parseOptionalString(value: string | null | undefined): string | null {
  if (value && value.length > 0) {
    return value;
  }
  return null;
}
