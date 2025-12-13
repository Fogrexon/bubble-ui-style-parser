import type {
  DynamicPrimitiveToken,
  KeywordToken,
  LimitedLengthToken,
  PrimitiveToken,
  StaticPrimitiveToken,
} from './grammarRule';
import type { ASTLeaf, LeafApplicableToken } from './ast';
import { getRangeStringProcessor } from './util';

/**
 * A helper function to create an `ASTLeaf` node.
 * @param tokenType The type of the token for the leaf.
 * @param value The value of the leaf node.
 * @param unit The unit, if any (e.g., 'px').
 * @returns A new `ASTLeaf` object.
 */
const createLeaf = <T extends string | number>(
  tokenType: LeafApplicableToken,
  value: T,
  unit?: string
): ASTLeaf<T> => ({
  type: 'leaf',
  tokenType,
  value,
  unit,
});

/**
 * Defines the signature for a function that parses a single string token
 * into an `ASTLeaf` of a specific type.
 * @template T The expected type of the leaf's value (string or number).
 * @param value The string token to parse.
 * @returns An `ASTLeaf` if parsing is successful, otherwise `null`.
 */
export type PrimitiveTokenParser<T extends string | number> = (value: string) => ASTLeaf<T> | null;

/**
 * Parses a token into a length `ASTLeaf`. It expects a number followed by an optional unit.
 * It excludes percentage values.
 */
const LengthTokenParser: PrimitiveTokenParser<number> = (value) => {
  const s = value.toLowerCase().trim();
  const unit = s.match(/(px|%|em|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc)$/);
  const number = s.match(/-?\d*\.?\d+/);
  if (!number || (unit && unit[0] === '%')) return null;
  const unitValue = unit ? unit[0] : '';
  const numberValue = parseFloat(number[0]);
  if (Number.isNaN(numberValue)) return null;
  return createLeaf('length', numberValue, unitValue);
};

/**
 * Parses a token into a percentage `ASTLeaf`. It expects a number followed by a '%' sign.
 */
const PercentageTokenParser: PrimitiveTokenParser<number> = (value) => {
  const s = value.toLowerCase().trim();
  const unit = s.match(/%$/);
  const number = s.match(/-?\d*\.?\d+/);
  if (!number || !unit) return null;
  const numberValue = parseFloat(number[0]);
  if (Number.isNaN(numberValue)) return null;
  return createLeaf('percentage', numberValue, '%');
};

/**
 * Parses a token into an integer `ASTLeaf`.
 */
const IntegerTokenParser: PrimitiveTokenParser<number> = (value) => {
  const number = value.match(/-?\d+/);
  if (!number) return null;
  const numberValue = parseInt(number[0], 10);
  if (Number.isNaN(numberValue)) return null;
  return createLeaf('integer', numberValue);
};

/**
 * Parses a token into a color `ASTLeaf`. It recognizes color keywords, hex, RGB(A), and HSL(A) values.
 */
const ColorTokenParser: PrimitiveTokenParser<string> = (value) => {
  const s = value.toLowerCase().trim();
  const commonColors = [
    'transparent',
    'currentcolor',
    'black',
    'silver',
    'gray',
    'white',
    'maroon',
    'red',
    'purple',
    'fuchsia',
    'green',
    'lime',
    'olive',
    'yellow',
    'navy',
    'blue',
    'teal',
    'aqua',
    'rebeccapurple',
    // Not limited to this, but list some famous ones for now
  ];
  if (
    !commonColors.includes(s) &&
    !/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s) &&
    !/^rgba?\s*\((\s*\d+%?\s*,\s*){2}\s*\d+%?\s*(,\s*(0|1|0?\.\d+)\s*)?\)$/.test(s) &&
    !/^hsla?\s*\((\s*\d+\s*,\s*){2}\s*\d+%\s*(,\s*(0|1|0?\.\d+)\s*)?\)$/.test(s)
  )
    return null; // Basic check, not exhaustive.
  return createLeaf('color', s);
};

/**
 * Parses a token into an image `ASTLeaf`. It primarily looks for `url(...)` syntax.
 */
const ImageTokenParser: PrimitiveTokenParser<string> = (value) => {
  const s = value.toLowerCase();
  const extractedUrl = s.match(/url\(([^)]+)\)/);
  if (!extractedUrl) return null;
  return createLeaf('image', extractedUrl[1].replace(/['"]/g, ''));
};

/**
 * Defines the signature for a function that generates a `PrimitiveTokenParser`.
 * This is used for creating parsers for dynamic tokens like `length<0,10>` or `keyword<A,B>`.
 * @template T The specific subtype of `DynamicPrimitiveToken`.
 * @template U The value type (string or number) of the resulting AST leaf.
 */
export type DynamicTokenParserGenerator<
  T extends DynamicPrimitiveToken,
  U extends string | number,
> = (tokenType: T) => PrimitiveTokenParser<U>;

const { tester: isLimitedLengthToken, getRange: getLimitedLengthTokenRange } =
  getRangeStringProcessor('length');

/**
 * Generates a parser for length tokens with min/max constraints (e.g., `length<0,100>`).
 */
const LimitedLengthTokenParserGenerator: DynamicTokenParserGenerator<LimitedLengthToken, number> = (
  tokenType
) => {
  const [min, max] = getLimitedLengthTokenRange(tokenType);

  return (value: string) => {
    const s = value.toLowerCase().trim();
    const unit = s.match(/(px|%|em|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc)$/);
    const number = s.match(/-?\d*\.?\d+/);
    if (!number || (unit && unit[0] === '%')) return null;
    const unitValue = unit ? unit[0] : '';
    const numberValue = parseFloat(number[0]);
    if (Number.isNaN(numberValue)) return null;
    if (numberValue < min || numberValue > max) return null;
    return createLeaf('length', numberValue, unitValue);
  };
};

/**
 * Type guard to check if a string is a `KeywordToken` definition.
 */
const isKeywordToken = (value: string): value is KeywordToken =>
  value.startsWith('keyword<') && value.endsWith('>');

/**
 * Generates a parser for a specific set of keywords (e.g., `keyword<auto,none>`).
 */
const KeywordTokenParserGenerator: DynamicTokenParserGenerator<KeywordToken, string> = (
  tokenType
) => {
  // keyword<type1,type2,...>
  const rawKeywords = tokenType.slice(8, -1); // remove 'keyword<' and '>'
  const keywords = rawKeywords.split(',').map((k) => k.trim().toLowerCase());

  return (value: string) => {
    const s = value.toLowerCase();
    if (!keywords.includes(s)) return null;
    return createLeaf('keyword', s);
  };
};

/**
 * Maps primitive token types to their corresponding parsed value types.
 */
type PrimitiveTokenParsedType = {
  length: number;
  color: string;
  percentage: number;
  integer: number;
  number: number;
  image: string;
  keyword: string;
};

/**
 * A type mapping static token types to their respective parser functions.
 */
type PrimitiveTokenParsers = {
  [K in Exclude<StaticPrimitiveToken, 'keyword'>]: PrimitiveTokenParser<
    PrimitiveTokenParsedType[K]
  >;
};

/**
 * A collection of parsers for static primitive token types.
 * These parsers handle tokens that have a fixed, predefined meaning.
 */
export const atomicTokenParsers: PrimitiveTokenParsers = {
  length: LengthTokenParser,
  percentage: PercentageTokenParser,
  integer: IntegerTokenParser,
  color: ColorTokenParser,
  image: ImageTokenParser,
};

/**
 * Selects and returns the appropriate atomic token parser for a given primitive token type.
 * It handles both static and dynamic primitive tokens.
 *
 * @param tokenType The `PrimitiveToken` type (e.g., 'length', 'keyword<auto,none>').
 * @returns The corresponding `PrimitiveTokenParser`, or `null` if the token type is not supported.
 */
export const atomicTokenParserSelector = (tokenType: PrimitiveToken) => {
  if (isLimitedLengthToken(tokenType)) {
    return LimitedLengthTokenParserGenerator(tokenType);
  }

  if (isKeywordToken(tokenType)) {
    return KeywordTokenParserGenerator(tokenType);
  }

  // After the guards, tokenType must be a StaticPrimitiveToken.
  // Using 'as any' here because TypeScript cannot infer the narrowed type
  // across the dynamic token checks.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (atomicTokenParsers as any)[tokenType] || null;
};
