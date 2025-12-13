import type { RangeString, SpeciallyFormattedString } from './util';

/**
 * Represents the set of static primitive token types that have a predefined, fixed meaning.
 */
export type StaticPrimitiveToken = 'length' | 'percentage' | 'integer' | 'color' | 'image';

/**
 * Represents a 'length' token with a specific range limitation.
 * It's a specialized string format `length<min,max>`.
 */
export type LimitedLengthToken = RangeString<'length'>;

/**
 * Represents a 'keyword' token, which is a set of specific string literals.
 * The second generic argument holds the array of allowed keyword strings.
 */
export type KeywordToken = SpeciallyFormattedString<'keyword', string[]>;

/**
 * Represents primitive tokens that have dynamic constraints, such as ranges or specific keyword sets.
 */
export type DynamicPrimitiveToken = LimitedLengthToken | KeywordToken;

/**
 * Represents any primitive token, whether static or dynamic.
 */
export type PrimitiveToken = StaticPrimitiveToken | DynamicPrimitiveToken;

/**
 * Represents an atomic definition in the grammar, which is a primitive token.
 */
export type AtomicDefinition = PrimitiveTokenDefinition;

/**
 * Represents a recursive grammar definition, which is composed of other grammar rules.
 * This includes unordered, sequence, choice, repetition, and label definitions.
 */
export type RecursiveDefinition =
  | UnorderedDefinition
  | SequenceDefinition
  | ChoiceDefinition
  | RepetitionDefinition
  | LabelDefinition;

/**
 * Represents a repetition constraint in the format `repetition<min,max>`.
 */
export type RepetitionType = RangeString<'repetition'>;

/**
 * Defines a primitive token in the grammar.
 * It can be a shorthand for a `LabelDefinition` if an `id` is specified.
 */
export type PrimitiveTokenDefinition = {
  /** The type of the definition, which is 'primitive'. */
  type: 'primitive';
  /** The type of the primitive token. */
  tokenType: PrimitiveToken;
  /** An optional identifier to label the token. */
  id?: string;
};

/**
 * Defines a grammar rule where the child rules can appear in any order.
 * Corresponds to the `||` operator in CSS grammar (e.g., `A || B || C`).
 */
export interface UnorderedDefinition {
  /** The type of the definition, which is 'unordered'. */
  type: 'unordered';
  /** The set of rules that can appear in any order. */
  rules: GrammarRule[];
  /** A unique identifier for this unordered group. */
  id: string;
}

/**
 * Defines a grammar rule where the child rules must appear in a specific sequence.
 * Corresponds to space-separated items in CSS grammar (e.g., `A B C`).
 */
export interface SequenceDefinition {
  /** The type of the definition, which is 'sequence'. */
  type: 'sequence';
  /** The sequence of rules. */
  rules: GrammarRule[];
  /** A unique identifier for this sequence. */
  id: string;
}

/**
 * Defines a grammar rule where only one of the child rules can be chosen.
 * Corresponds to the `|` operator in CSS grammar (e.g., `A | B | C`).
 */
export interface ChoiceDefinition {
  /** The type of the definition, which is 'choice'. */
  type: 'choice';
  /** The set of alternative rules. */
  rules: GrammarRule[];
  /** A unique identifier for this choice group. */
  id:string;
}

/**
 * Defines a grammar rule that can be repeated a certain number of times.
 * Corresponds to CSS repetition syntax (e.g., `A{1,3}`).
 */
export interface RepetitionDefinition {
  /** The type of the definition, which can be 'repetition' or a ranged `RepetitionType`. */
  type: 'repetition' | RepetitionType;
  /** The rule to be repeated. */
  rule: GrammarRule;
  /** A unique identifier for this repetition rule. */
  id: string;
}

/**
 * Defines a label for a grammar rule, giving it a name.
 * This is used for naming a rule and has no direct semantic meaning in parsing structure itself.
 * Example: `my-label: A`
 */
export interface LabelDefinition {
  /** The type of the definition, which is 'label'. */
  type: 'label';
  /** The rule being labeled. */
  rule: GrammarRule;
  /** The identifier or name for the rule. */
  id: string;
}

/**
 * Represents a complete grammar rule.
 * It can be any of the defined rule types, from a simple primitive to a complex nested structure.
 */
export type GrammarRule =
  | PrimitiveTokenDefinition
  | SequenceDefinition
  | UnorderedDefinition
  | ChoiceDefinition
  | RepetitionDefinition
  | LabelDefinition;
