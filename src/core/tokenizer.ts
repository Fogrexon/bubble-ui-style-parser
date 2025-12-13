/**
 * A list of common CSS units used for parsing numeric values.
 */
const units = 'px|\\%|em|rem|vw|vh|vmin|vmax|ch|ex|mm|cm|in|pt|pc';

/**
 * The regular expression for tokenizing a style string. It is designed to capture:
 * 1. Function calls like `url(...)`.
 * 2. Numeric values with units (e.g., `10px`, `-5.5em`).
 * 3. Plain numeric values (integers or floats).
 * 4. Any other non-whitespace characters as a single token.
 */
const tokenizerRegex = new RegExp(
  `\\b\\w+\\([^)]+\\)|` + // 1. Functions like url(xxx)
    `((?:-\\s*)?\\d+(?:\\.\\d+)?\\s*(?:${units}))|` + // 2. Number with unit
    `((?:-\\s*)?\\d+(?:\\.\\d+)?)\\b|` + // 3. Number without unit
    `[^\\s]+`, // 4. Any other non-whitespace sequence
  'g'
);

/**
 * Splits a style string into an array of tokens.
 * This function serves as the first step in the parsing process, breaking the raw
 * string into meaningful parts based on the `tokenizerRegex`.
 *
 * @param value The raw style string to tokenize (e.g., "10px solid #fff").
 * @returns An array of string tokens. Returns an empty array if the input is empty or has no matches.
 * @example
 * const tokens = tokenizer('1.5em red');
 * // tokens would be: ['1.5em', 'red']
 */
export const tokenizer = (value: string) => {
  const tokens = value.match(tokenizerRegex);
  if (!tokens) return [];

  return tokens;
};
