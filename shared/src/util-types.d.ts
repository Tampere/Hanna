/**
 * Extracts string literal type with given suffix from given base string literal.
 *
 * @example `Suffix<"a.foo" | "a.bar" | "b.baz", "a.">` = `"foo" | "bar"`
 */
export type Suffix<Base extends string, Prefix extends string> = Base extends `${Prefix}${infer R}`
  ? R
  : never;
