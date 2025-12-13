# Bubble UI Style Parser - Syntax Configuration

The Bubble UI Style Parser provides a robust and flexible mechanism for defining custom grammars using `GrammarRule` objects. This document details how to construct these rules to parse your desired style syntax.

## Understanding `GrammarRule`

A `GrammarRule` is a plain JavaScript object that describes a particular syntactical construct. You pass an instance of `GrammarRule` to `parserGenerator` to create a parser function.

All `GrammarRule` objects share two common properties:

-   `id: string`: A unique identifier for this rule. This `id` will be used as the `id` of the corresponding "branch" node in the generated AST.
-   `type: 'primitive' | 'sequence' | 'unordered' | 'choice' | 'repetition'`: Specifies the kind of grammar rule, dictating how it matches against the input.

Let's explore each `type` in detail:

### `primitive` Grammar Rule

A `primitive` rule is the most basic type, responsible for parsing a single atomic value. These rules leverage internal atomic token parsers to convert raw string values into structured `leaf` nodes in the AST.

-   **Required Properties**:
    -   `tokenType: string`: A string that specifies which atomic token parser to use. This string can also include constraints.

#### Available Atomic Token Types and Examples

The `tokenType` string maps to various internal parsers, each designed for a specific data type. The generated AST `leaf` node will have `type: 'leaf'` and `tokenType` matching the base atomic type (e.g., `'length'`, `'color'`).

| `tokenType` String            | Input Example          | AST `leaf` Node Example                                                                   | Description                                                         |
| :---------------------------- | :--------------------- | :---------------------------------------------------------------------------------------- | :------------------------------------------------------------------ |
| `'length'`                    | `"10px"`, `"2em"`, `"5"` | `{ value: 10, unit: "px" }`, `{ value: 2, unit: "em" }`, `{ value: 5, unit: "" }`         | Parses numeric values with optional CSS units.                      |
| `'percentage'`                | `"50%"`                | `{ value: 50, unit: "%" }`                                                                | Parses numeric values followed by a percentage sign.                |
| `'integer'`                   | `"100"`, `"-50"`       | `{ value: 100 }`, `{ value: -50 }`                                                        | Parses whole numbers.                                               |
| `'color'`                     | `"#ff0000"`, `"rgb(255, 0, 0)"`, `"rgba(255, 0, 0, 1)"` | `{ value: "#ff0000" }`, `{ value: "rgb(255, 0, 0)" }`, `{ value: "rgba(255, 0, 0, 1)" }` | Parses standard CSS color formats.                                  |
| `'image'`                     | `"url(image.png)"`     | `{ value: "image.png" }`                                                                  | Parses `url(...)` or `url("...")` for image paths.                  |
| `'keyword'`                   | `"solid"`, `"auto"`    | `{ value: "solid" }`, `{ value: "auto" }`                                                 | Parses general string keywords.                                     |

#### Constrained `tokenType`s

You can apply constraints to `tokenType` strings to further restrict the values that can be parsed:

-   **Range for Numeric Types (e.g., `length`, `percentage`, `integer`)**:
    -   Syntax: `tokenType<min,max>`
    -   Example: `tokenType: 'length<0,100>'` will only parse length values between 0 and 100 (inclusive).
    -   Example: `tokenType: 'integer<10,>'` will parse integers greater than or equal to 10.
    -   Example: `tokenType: 'percentage<,50>'` will parse percentages less than or equal to 50.

-   **Allowed Keywords for `'keyword'` Type**:
    -   Syntax: `keyword<val1,val2,...>`
    -   Example: `tokenType: 'keyword<solid,dashed,dotted>'` will only parse "solid", "dashed", or "dotted".

**Example `primitive` rule with constraints**:

```typescript
const constrainedLengthRule: GrammarRule = {
  id: 'constrainedLength',
  type: 'primitive',
  tokenType: 'length<0,100>', // Only parses lengths between 0 and 100
};

const specificKeywordRule: GrammarRule = {
  id: 'lineStyle',
  type: 'primitive',
  tokenType: 'keyword<solid,dashed>', // Only parses "solid" or "dashed"
};
```

### `sequence` Grammar Rule

A `sequence` rule matches an ordered list of other `GrammarRule`s. All sub-rules must match in the specified order for the `sequence` rule to succeed.

-   **Required Properties**:
    -   `rules: GrammarRule[]`: An array of `GrammarRule` objects that must be matched sequentially.

**Example**:

```typescript
const borderShorthandRule: GrammarRule = {
  id: 'borderShorthand',
  type: 'sequence',
  rules: [
    { id: 'borderWidth', type: 'primitive', tokenType: 'length' },
    { id: 'borderStyle', type: 'primitive', tokenType: 'keyword<solid,dashed>' },
    { id: 'borderColor', type: 'primitive', tokenType: 'color' },
  ],
};
// This rule would match "1px solid red" but not "solid 1px red".
```

### `unordered` Grammar Rule

An `unordered` rule matches a list of other `GrammarRule`s, but the order does not matter. It can also successfully parse if only a subset of the defined rules are present in the input.

-   **Required Properties**:
    -   `rules: GrammarRule[]`: An array of `GrammarRule` objects that can be matched in any order.

**Example**:

```typescript
const flexibleBorderRule: GrammarRule = {
  id: 'flexibleBorder',
  type: 'unordered',
  rules: [
    { id: 'borderWidth', type: 'primitive', tokenType: 'length' },
    { id: 'borderStyle', type: 'primitive', tokenType: 'keyword<solid,dashed>' },
    { id: 'borderColor', type: 'primitive', tokenType: 'color' },
  ],
};
// This rule would match "1px solid red", "solid 1px red", "red 1px", etc.
```

### `choice` Grammar Rule

A `choice` rule attempts to match one, and only one, of its sub-rules. The first sub-rule that successfully parses the input will be chosen.

-   **Required Properties**:
    -   `rules: GrammarRule[]`: An array of `GrammarRule` objects, from which exactly one must match.

**Example**:

```typescript
const dimensionRule: GrammarRule = {
  id: 'dimension',
  type: 'choice',
  rules: [
    { id: 'lengthValue', type: 'primitive', tokenType: 'length' },
    { id: 'percentageValue', type: 'primitive', tokenType: 'percentage' },
  ],
};
// This rule would match "10px" or "50%" but not "10px 50%".
```

### `repetition` Grammar Rule

A `repetition` rule allows a single `GrammarRule` to be repeated a specified number of times.

-   **Required Properties**:
    -   `rule: GrammarRule`: The single `GrammarRule` that should be repeated.
-   **Optional Properties**:
    -   `min?: number`: The minimum number of repetitions (inclusive). Defaults to 0 if not specified.
    -   `max?: number`: The maximum number of repetitions (inclusive). If not specified, repetitions are infinite.

-   **Syntax for `type`**: You can also specify min/max directly in the `type` string:
    -   `type: 'repetition<min,max>'` (e.g., `'repetition<1,4>'` for 1 to 4 times)
    -   `type: 'repetition<min,>'` (e.g., `'repetition<2,>'` for 2 or more times)
    -   `type: 'repetition<,max>'` (e.g., `'repetition<,3>'` for up to 3 times)
    -   If no numbers are specified (e.g., `'repetition'`), it defaults to `0` or more times (infinite).

**Example**:

```typescript
const fourLengthsRule: GrammarRule = {
  id: 'fourLengths',
  type: 'repetition<4,4>', // Exactly 4 lengths
  rule: { id: 'lengthItem', type: 'primitive', tokenType: 'length' },
};

const atLeastOneLengthRule: GrammarRule = {
  id: 'atLeastOneLength',
  type: 'repetition<1,>', // One or more lengths
  rule: { id: 'lengthItem', type: 'primitive', tokenType: 'length' },
};
// fourLengthsRule would match "1px 2px 3px 4px" but not "1px 2px".
// atLeastOneLengthRule would match "1px", "1px 2px", etc.
```

By combining these `GrammarRule` types and leveraging the power of `primitive` rules with their atomic token types and constraints, you can define highly expressive and precise grammars for parsing diverse style definitions.