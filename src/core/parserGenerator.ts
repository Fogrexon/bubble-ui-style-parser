import type {
  ChoiceDefinition,
  GrammarRule,
  LabelDefinition,
  PrimitiveTokenDefinition,
  RepetitionDefinition,
  SequenceDefinition,
  UnorderedDefinition,
} from './grammarRule';
import { atomicTokenParserSelector } from './atomicTokenParsers';
import type { ASTNode, ASTBranch } from './ast';
import { getRangeStringProcessor } from './util';
import { tokenizer } from './tokenizer';

const { tester: repetitionTypeTester, getRange: repetitionTypeRange } =
  getRangeStringProcessor('repetition');

/**
 * Custom error class for parsing failures.
 * Thrown when the parser encounters a syntax that doesn't match the grammar rules
 * or when the grammar definition itself is invalid.
 */
export class ParseError extends Error {
  /**
   * @param message The error message.
   */
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
    Object.setPrototypeOf(this, ParseError.prototype);
  }
}

/**
 * Represents a high-level style parser function.
 * It takes a string value and returns the root of the parsed Abstract Syntax Tree (AST).
 *
 * @param value The input string to parse.
 * @returns The root `ASTBranch` of the parsed tree.
 * @throws {ParseError} If the input string cannot be fully parsed according to the grammar.
 */
export type StyleParser = (value: string) => ASTBranch;

/**
 * Represents an internal parser function used by the parser generator.
 * It operates on an array of tokens and tries to match a grammar rule starting from a specific index.
 *
 * @param tokens The array of tokens to parse.
 * @param currentIndex The index in the token array to start parsing from.
 * @returns An object containing the parsed AST nodes and the number of tokens consumed, or `null` if parsing fails.
 */
export type InternalStyleParser = (
  tokens: string[],
  currentIndex: number
) => { asts: ASTNode[]; consumed: number } | null;

/**
 * Internal helper type to pair a grammar rule's ID with its corresponding internal parser.
 */
type ASTPair = {
  id: string;
  parser: InternalStyleParser;
};

/**
 * Creates an array of `ASTPair` objects for a given composite grammar rule.
 * @param rule The grammar rule (sequence, choice, or unordered).
 * @returns An array of `ASTPair`s.
 */
const getParserPairArray = (
  rule: SequenceDefinition | ChoiceDefinition | UnorderedDefinition
): ASTPair[] =>
  rule.rules.map((element) => ({
    id: element.id || element.type,
    parser: internalParserGenerator(element),
  }));

/**
 * Generates an internal parser for a primitive token definition.
 * @param rule The primitive token definition.
 * @returns An `InternalStyleParser` for the primitive token.
 */
const primitiveParserGenerator = (rule: PrimitiveTokenDefinition): InternalStyleParser => {
  const atomicParser = atomicTokenParserSelector(rule.tokenType);
  return (tokens, currentIndex) => {
    if (currentIndex < tokens.length) {
      const parsedValue = atomicParser(tokens[currentIndex]);
      if (parsedValue !== null) {
        if (!rule.id) {
          return { asts: [parsedValue], consumed: 1 };
        }
        return {
          asts: [
            {
              type: 'branch',
              id: rule.id,
              children: [parsedValue],
            },
          ],
          consumed: 1,
        };
      }
    }
    return null;
  };
};

/**
 * Generates an internal parser for a sequence of grammar rules.
 * @param rule The sequence definition.
 * @returns An `InternalStyleParser` for the sequence.
 */
const sequenceParserGenerator = (rule: SequenceDefinition): InternalStyleParser => {
  const astPairs = getParserPairArray(rule);

  return (tokens, currentIndex) => {
    const sequenceAstParts: ASTNode[] = [];
    let totalConsumedInSequence = 0;
    let currentElementIndex = currentIndex;

    for (let i = 0; i < astPairs.length; i += 1) {
      if (currentElementIndex >= tokens.length) {
        // If we reach the end of tokens, we cannot continue parsing.
        return null;
      }
      const parserPair = astPairs[i];
      const result = parserPair.parser(tokens, currentElementIndex);
      if (result) {
        sequenceAstParts.push(...result.asts);
        totalConsumedInSequence += result.consumed;
        currentElementIndex += result.consumed;
      } else {
        return null;
      }
    }

    if (totalConsumedInSequence > 0 || rule.rules.length === 0) {
      return {
        asts: [
          {
            type: 'branch',
            id: rule.id,
            children: sequenceAstParts,
          },
        ],
        consumed: totalConsumedInSequence,
      };
    }
    return null;
  };
};

/**
 * Generates an internal parser for an unordered set of grammar rules.
 * @param rule The unordered definition.
 * @returns An `InternalStyleParser` for the unordered set.
 */
const unorderedParserGenerator = (rule: UnorderedDefinition): InternalStyleParser => {
  const astPairs = getParserPairArray(rule);

  return (tokens, currentIndex) => {
    const unorderedAstParts: ASTNode[] = [];
    let currentTotalConsumed = currentIndex;
    const validParsers = [...astPairs];

    while (currentTotalConsumed < tokens.length) {
      let matched: number = -1;

      for (let i = 0; i < validParsers.length; i += 1) {
        const parserPair = validParsers[i];
        const result = parserPair.parser(tokens, currentTotalConsumed);
        if (result) {
          unorderedAstParts.push(...result.asts);
          currentTotalConsumed += result.consumed;
          matched = i;
          break;
        }
      }

      if (matched < 0) {
        break;
      }

      validParsers.splice(matched, 1);
    }

    if (currentTotalConsumed === currentIndex) {
      // no match
      return null;
    }
    return {
      asts: [
        {
          type: 'branch',
          id: rule.id,
          children: unorderedAstParts,
        },
      ],
      consumed: currentTotalConsumed - currentIndex,
    };
  };
};

/**
 * Generates an internal parser for a choice of grammar rules.
 * @param rule The choice definition.
 * @returns An `InternalStyleParser` for the choice.
 */
const choiceParserGenerator = (rule: ChoiceDefinition): InternalStyleParser => {
  const astPairs = getParserPairArray(rule);

  return (tokens, currentIndex) => {
    const choiceAstParts: ASTNode[] = [];

    for (let i = 0; i < astPairs.length; i += 1) {
      const parserPair = astPairs[i];
      const result = parserPair.parser(tokens, currentIndex);
      if (result) {
        choiceAstParts.push(...result.asts);
        return {
          asts: [
            {
              type: 'branch',
              id: rule.id,
              children: choiceAstParts,
            },
          ],
          consumed: result.consumed,
        };
      }
    }
    return null;
  };
};

/**
 * Generates an internal parser for a repetition of a grammar rule.
 * @param rule The repetition definition.
 * @returns An `InternalStyleParser` for the repetition.
 */
const repetitionParserGenerator = (rule: RepetitionDefinition): InternalStyleParser => {
  const [min, max] = rule.type === 'repetition' ? [0, Infinity] : repetitionTypeRange(rule.type);
  if (min > max) {
    throw new ParseError(
      `Invalid repetition rule: min (${min}) cannot be greater than max (${max}).`
    );
  }
  if (min < 0 || max < 0) {
    throw new ParseError(
      `Invalid repetition rule: min (${min}) and max (${max}) must be non-negative.`
    );
  }
  const innerParser = internalParserGenerator(rule.rule);

  return (tokens, currentIndex) => {
    const repetitionResults: ASTNode[] = [];
    let repetitionCount = 0;
    let currentRepetitionTokenIndex = currentIndex;

    while (repetitionCount < max && currentRepetitionTokenIndex < tokens.length) {
      const result = innerParser(tokens, currentRepetitionTokenIndex);

      if (result && result.consumed > 0) {
        repetitionCount += 1;
        repetitionResults.push(...result.asts);
        currentRepetitionTokenIndex += result.consumed;
      } else if (result && result.consumed === 0) {
        // If matched but no tokens were consumed (e.g., the inner rule is optional and matches empty),
        // it is necessary to stop here to prevent an infinite loop.
        break;
      } else {
        // no match
        break;
      }
    }

    if (repetitionCount >= min) {
      return {
        asts: [
          {
            type: 'branch',
            id: rule.id,
            children: repetitionResults,
          },
        ],
        consumed: currentRepetitionTokenIndex - currentIndex,
      };
    }
    return null;
  };
};

/**
 * Generates an internal parser for a labeled grammar rule.
 * @param rule The label definition.
 * @returns An `InternalStyleParser` for the labeled rule.
 */
const labelParserGenerator = (rule: LabelDefinition): InternalStyleParser => {
  const innerParser = internalParserGenerator(rule.rule);
  return (tokens, currentIndex) => {
    const result = innerParser(tokens, currentIndex);
    if (result) {
      return {
        asts: [
          {
            type: 'branch',
            id: rule.id,
            children: result.asts,
          },
        ],
        consumed: result.consumed,
      };
    }
    return null;
  };
};

/**
 * Recursively generates an internal parser based on the type of the grammar rule.
 * This is the main dispatcher for creating the parsing logic.
 * @param rule The grammar rule to generate a parser for.
 * @returns The corresponding `InternalStyleParser`.
 */
const internalParserGenerator = (rule: GrammarRule): InternalStyleParser => {
  switch (rule.type) {
    case 'primitive':
      return primitiveParserGenerator(rule);
    case 'unordered':
      return unorderedParserGenerator(rule);
    case 'sequence':
      return sequenceParserGenerator(rule);
    case 'choice':
      return choiceParserGenerator(rule);
    case 'repetition':
      return repetitionParserGenerator(rule);
    case 'label':
      return labelParserGenerator(rule);

    default: {
      if (repetitionTypeTester(rule.type)) {
        const repetitionRule = rule as RepetitionDefinition;
        return repetitionParserGenerator(repetitionRule);
      }
      throw new ParseError(`Unsupported grammar rule type: ${rule}`);
    }
  }
};

/**
 * Creates a high-level style parser function from a grammar rule definition.
 * This is the main entry point for creating a new parser.
 *
 * @param rule The root `GrammarRule` that defines the language to be parsed.
 * @returns A `StyleParser` function that takes a string and returns a parsed AST.
 * @example
 * const grammar = { type: 'primitive', tokenType: 'length', id: 'my-length' };
 * const lengthParser = parserGenerator(grammar);
 * const ast = lengthParser('10px');
 * // ast would be: { type: 'branch', id: 'root', children: [...] }
 */
export const parserGenerator = (rule: GrammarRule): StyleParser => {
  const internalParser = internalParserGenerator(rule);

  return (value: string) => {
    const tokens = tokenizer(value);
    const result = internalParser(tokens, 0);
    if (result && result.consumed === tokens.length) {
      return { type: 'branch', id: 'root', children: result.asts };
    }
    throw new ParseError(`Failed to parse value: ${value}`);
  };
};
