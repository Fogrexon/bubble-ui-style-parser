/**
 * Represents a string that defines a numeric range.
 * @template T A string literal that serves as the prefix (e.g., 'length').
 * @example
 * // A length between 0 and 100
 * type LimitedLength = RangeString<'length'>; // "length<0,100>"
 */
export type RangeString<T extends string> = `${T}<${number | '-∞'},${number | '∞'}>`;

/**
 * A type for a function that checks if a string conforms to the `RangeString` format.
 */
export type IsRangeStringType<T extends string> = (value: string) => value is RangeString<T>;
/**
 * A type for a function that extracts the [min, max] tuple from a `RangeString`.
 */
export type GetRangeStringRangeType<T extends string> = (value: RangeString<T>) => [number, number];
/**
 * An object containing a `tester` and a `getRange` function for a specific `RangeString` type.
 */
export type RangeStringProcessor<T extends string> = {
  tester: IsRangeStringType<T>;
  getRange: GetRangeStringRangeType<T>;
};

/**
 * Creates a processor object for handling range-formatted strings (e.g., "length<0,100>").
 * The returned object contains a `tester` function to validate the format and a
 * `getRange` function to extract the minimum and maximum values.
 *
 * @template T The base string prefix for the range format (e.g., 'length').
 * @param baseString The prefix to use for the range string.
 * @returns A `RangeStringProcessor<T>` object with `tester` and `getRange` methods.
 * @throws {Error} If the format is invalid or if min > max.
 */
export const getRangeStringProcessor = <T extends string>(baseString: T) => {
  const regex = new RegExp(`^${baseString}<(-?\\d+|-∞),(-?\\d+|\\+?∞)>$`);
  const processor: RangeStringProcessor<T> = {
    tester: (value: string): value is RangeString<T> => regex.test(value),
    getRange: (value: RangeString<T>): [number, number] => {
      const match = value.match(regex);
      if (!match) throw new Error(`Invalid range string: ${value}`);
      const min = match[1] === '-∞' ? -Infinity : parseFloat(match[1]);
      const max = match[2] === '∞' ? Infinity : parseFloat(match[2]);
      if (min > max) throw new Error(`Invalid range: ${min} is greater than ${max}`);
      return [min, max];
    },
  };
  return processor;
};

/**
 * A utility type that joins an array of strings with a given delimiter.
 * @template T An array of strings (e.g., `['a', 'b', 'c']`).
 * @template D The delimiter string (e.g., `,`).
 * @returns The joined string (e.g., `'a,b,c'`).
 */
export type Join<T extends readonly string[], D extends string> = T extends []
  ? ''
  : T extends [string]
    ? T[0]
    : T extends readonly [string, ...infer Rest]
      ? Rest extends readonly string[]
        ? `${T[0]}${D}${Join<Rest, D>}`
        : never
      : string;

/**
 * Creates a specially formatted string type, typically for defining dynamic tokens.
 * It combines a keyword prefix with a comma-separated list of types.
 *
 * @template TKeyword The prefix keyword.
 * @template TTypes An array of string literals for the types.
 * @example
 * // Creates the type "keyword<type1,type2>"
 * type MyKeyword = SpeciallyFormattedString<'keyword', ['type1', 'type2']>;
 */
export type SpeciallyFormattedString<
  TKeyword extends string,
  TTypes extends readonly string[],
> = `${TKeyword}<${Join<TTypes, ','>}>`;
