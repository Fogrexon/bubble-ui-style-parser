import type { RangeString, SpeciallyFormattedString } from './util';

export type StaticPrimitiveToken = 'length' | 'percentage' | 'integer' | 'color' | 'image';

export type LimitedLengthToken = RangeString<'length'>;

export type KeywordToken = SpeciallyFormattedString<'keyword', string[]>;

export type DynamicPrimitiveToken = LimitedLengthToken | KeywordToken;

export type PrimitiveToken = StaticPrimitiveToken | DynamicPrimitiveToken;

export type AtomicDefinition = PrimitiveTokenDefinition;
export type RecursiveDefinition =
  | UnorderedDefinition
  | SequenceDefinition
  | ChoiceDefinition
  | RepetitionDefinition
  | LabelDefinition;

export type RepetitionType = RangeString<'repetition'>;

/**
 * primitive definition
 * shorthand of LabelDefinition if id is specified
 */
export type PrimitiveTokenDefinition = {
  type: 'primitive';
  tokenType: PrimitiveToken;
  id?: string;
};

/**
 * unordered definition
 * A || B || C
 */
export interface UnorderedDefinition {
  type: 'unordered';
  rules: GrammarRule[];
  id: string;
}

/**
 * sequence definition
 * A B C
 */
export interface SequenceDefinition {
  type: 'sequence';
  rules: GrammarRule[];
  id: string;
}

/**
 * choice definition
 * A | B | C
 */
export interface ChoiceDefinition {
  type: 'choice';
  rules: GrammarRule[];
  id: string;
}

/**
 * repetition definition
 * A{1,3}
 */
export interface RepetitionDefinition {
  type: 'repetition' | RepetitionType; // 'repetition<min,max>'
  rule: GrammarRule;
  id: string;
}

/**
 * label definition
 * label: A
 * (for naming a rule, no semantic meaning by itself)
 */
export interface LabelDefinition {
  type: 'label';
  rule: GrammarRule;
  id: string;
}

/**
 * grammar rule
 * keyword | type | sequence | unordered | choice | repetition
 */
export type GrammarRule =
  | PrimitiveTokenDefinition
  | SequenceDefinition
  | UnorderedDefinition
  | ChoiceDefinition
  | RepetitionDefinition
  | LabelDefinition;
