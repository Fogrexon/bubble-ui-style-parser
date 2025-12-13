# Bubble UI Style Parser - Quickstart Guide

This guide will help you quickly get started with using the Bubble UI Style Parser library to parse style definitions and generate an Abstract Syntax Tree (AST).

## Installation

First, ensure the library is included in your project. If you're building from source, follow the [Build Instructions](build.md) and then reference the compiled output.

## Basic Usage

The primary way to use the Bubble UI Style Parser is by generating a parser function using `parserGenerator` and providing it with a `GrammarRule` object. This generated parser function then takes a string input and returns a structured AST (Abstract Syntax Tree).

You **do not** directly interact with `Tokenizer` or `atomicTokenParsers` when using `parserGenerator`; these are handled internally based on your `GrammarRule` definitions.

### 1. Define Your Grammar Rule

A `GrammarRule` defines the structure of the style you want to parse. It can be of several types: `primitive`, `sequence`, `unordered`, `choice`, or `repetition`.

#### Example: Primitive Grammar Rule (Parsing a Single Value)

Let's say you want to parse a simple length value like `"10px"`.

```typescript
import { parserGenerator } from './src/core/parserGenerator';
import type { GrammarRule } from './src/core/grammarRule';

// Define a grammar rule that expects a 'length' type token
const lengthRule: GrammarRule = {
  id: 'myLength', // An identifier for this rule in the AST
  type: 'primitive',
  tokenType: 'length', // This uses an internal atomic parser for lengths
};

// Generate the parser function
const parseLength = parserGenerator(lengthRule);

// Use the parser
const ast = parseLength('10px');
console.log(JSON.stringify(ast, null, 2));

/*
Expected AST:
{
  "type": "branch",
  "id": "root",
  "children": [
    {
      "type": "branch",
      "id": "myLength",
      "children": [
        {
          "type": "leaf",
          "tokenType": "length",
          "value": 10,
          "unit": "px"
        }
      ]
    }
  ]
}
*/
```

The `tokenType` property in a `primitive` rule can be one of several predefined atomic types (e.g., `'length'`, `'percentage'`, `'integer'`, `'color'`, `'image'`, `'keyword'`). You can also add constraints, like `'length<0,100>'` or `'keyword<solid, dashed>'`. More details on `tokenType` values can be found in the [Syntax Configuration](syntax-config.md) guide.

### 2. Parse the Input String

Once you have your parser function, simply call it with the string you want to parse.

```typescript
// Continuing from the previous example:
const inputString = '25em';
const newAst = parseLength(inputString);
console.log(JSON.stringify(newAst, null, 2));

/*
Expected AST:
{
  "type": "branch",
  "id": "root",
  "children": [
    {
      "type": "branch",
      "id": "myLength",
      "children": [
        {
          "type": "leaf",
          "tokenType": "length",
          "value": 25,
          "unit": "em"
        }
      ]
    }
  ]
}
*/
```

If the input string does not match the defined `GrammarRule`, the parser will throw an error. You should wrap calls to the parser in a `try-catch` block to handle invalid inputs gracefully.

```typescript
try {
  parseLength('invalid-value');
} catch (error) {
  console.error(error.message); // Output: Failed to parse value: invalid-value
}
```

## Advanced Grammar Rules

Here are examples of other `GrammarRule` types:

### Sequence Grammar Rule

Matches rules in a specific order.

```typescript
// Example: Parsing a border definition like "1px 10% red"
const borderRule: GrammarRule = {
  id: 'myBorder',
  type: 'sequence',
  rules: [
    { id: 'borderWidth', type: 'primitive', tokenType: 'length' },
    { id: 'borderRadius', type: 'primitive', tokenType: 'percentage' },
    { id: 'borderColor', type: 'primitive', tokenType: 'color' },
  ],
};
const parseBorder = parserGenerator(borderRule);
const astBorder = parseBorder('1px 10% red');
console.log(JSON.stringify(astBorder, null, 2));

/*
Expected AST:
{
  "type": "branch",
  "id": "root",
  "children": [
    {
      "type": "branch",
      "id": "myBorder",
      "children": [
        { "type": "branch", "id": "borderWidth", "children": [...] }, // leaf for 1px
        { "type": "branch", "id": "borderRadius", "children": [...] }, // leaf for 10%
        { "type": "branch", "id": "borderColor", "children": [...] }  // leaf for red
      ]
    }
  ]
}
*/
```

### Unordered Grammar Rule

Matches rules in any order. It can also parse a subset of the defined rules.

```typescript
// Example: Parsing a border with width, color, and style in any order, allowing missing parts
const borderUnorderedRule: GrammarRule = {
  id: 'myBorderUnordered',
  type: 'unordered',
  rules: [
    { id: 'borderWidth', type: 'primitive', tokenType: 'length' },
    { id: 'borderStyle', type: 'primitive', tokenType: 'keyword<solid, dashed>' },
    { id: 'borderColor', type: 'primitive', tokenType: 'color' },
  ],
};
const parseBorderUnordered = parserGenerator(borderUnorderedRule);

// Parses with items in different order and missing items
const astUnordered1 = parseBorderUnordered('solid red 2px');
const astUnordered2 = parseBorderUnordered('5px dashed');
console.log(JSON.stringify(astUnordered1, null, 2));
console.log(JSON.stringify(astUnordered2, null, 2));
```

### Choice Grammar Rule

Matches exactly one rule from a set of choices.

```typescript
// Example: Parsing either a length or a percentage
const sizeChoiceRule: GrammarRule = {
  id: 'mySize',
  type: 'choice',
  rules: [
    { id: 'lengthValue', type: 'primitive', tokenType: 'length' },
    { id: 'percentageValue', type: 'primitive', tokenType: 'percentage' },
  ],
};
const parseSize = parserGenerator(sizeChoiceRule);
const astChoice1 = parseSize('100px');
const astChoice2 = parseSize('50%');
console.log(JSON.stringify(astChoice1, null, 2));
console.log(JSON.stringify(astChoice2, null, 2));
```

### Repetition Grammar Rule

Matches a rule that can repeat a specified number of times, or infinitely.

```typescript
// Example: Parsing 2 to 4 length values (e.g., "1px 2px 3px")
const multipleLengthsRule: GrammarRule = {
  id: 'myLengths',
  type: 'repetition<2,4>', // Repeat between 2 and 4 times
  rule: { type: 'primitive', tokenType: 'length' },
};
const parseMultipleLengths = parserGenerator(multipleLengthsRule);
const astRepetition = parseMultipleLengths('1px 2px 3px');
console.log(JSON.stringify(astRepetition, null, 2));
```

By understanding these grammar rule types, you can construct sophisticated parsers for complex style syntax.

## Further Reading

-   [**Syntax Configuration**](syntax-config.md): Dive deeper into the details of defining `GrammarRule`s, available `tokenType`s, and advanced configurations.
-   [**Overview**](overview.md): Understand the core concepts and architecture of the parser.