# Bubble UI Style Parser - クイックスタートガイド

このガイドでは、Bubble UI Style Parser ライブラリを使用してスタイル定義を解析し、抽象構文木（AST）を生成するまでの手順を素早く習得できます。

## インストール

まず、プロジェクトにライブラリが含まれていることを確認してください。ソースからビルドする場合は、[ビルド手順](build.md)に従ってから、コンパイルされた出力を参照してください。

## 基本的な使い方

Bubble UI Style Parser の主な使用方法は、`parserGenerator` 関数に `GrammarRule` オブジェクトを提供してパーサー関数を生成することです。生成されたパーサー関数は、文字列入力を受け取り、構造化された AST を返します。

`parserGenerator` を使用する際、`Tokenizer` や `atomicTokenParsers` を直接操作することはありません。これらは `GrammarRule` の定義に基づいて内部的に処理されます。

### 1. 文法ルールを定義する

`GrammarRule` は、解析したいスタイルの構造を定義します。これには、`primitive`、`sequence`、`unordered`、`choice`、`repetition` のいくつかのタイプがあります。

#### 例: プリミティブ文法ルール (単一値の解析)

例えば、`"10px"` のような単純な長さの値を解析したいとします。

```typescript
import { parserGenerator } from './src/core/parserGenerator';
import type { GrammarRule } from './src/core/grammarRule';

// 'length' タイプのトークンを期待する文法ルールを定義します
const lengthRule: GrammarRule = {
  id: 'myLength', // AST 内でのこのルールの識別子
  type: 'primitive',
  tokenType: 'length', // 長さ用のアトミックパーサーを内部的に使用します
};

// パーサー関数を生成します
const parseLength = parserGenerator(lengthRule);

// パーサーを使用します
const ast = parseLength('10px');
console.log(JSON.stringify(ast, null, 2));

/*
期待される AST:
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

`primitive` ルールの `tokenType` プロパティは、いくつかの事前定義されたアトミックタイプ（例：`'length'`、`'percentage'`、`'integer'`、`'color'`、`'image'`、`'keyword'`）のいずれかになります。また、`'length<0,100>'` や `'keyword<solid, dashed>'` のように制約を追加することもできます。`tokenType` の詳細については、[構文設定](syntax-config.md)ガイドを参照してください。

### 2. 入力文字列を解析する

パーサー関数を用意したら、解析したい文字列を引数として呼び出すだけです。

```typescript
// 上記の例から続く:
const inputString = '25em';
const newAst = parseLength(inputString);
console.log(JSON.stringify(newAst, null, 2));

/*
期待される AST:
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

入力文字列が定義された `GrammarRule` に一致しない場合、パーサーはエラーをスローします。無効な入力を適切に処理するために、パーサーの呼び出しを `try-catch` ブロックで囲む必要があります。

```typescript
try {
  parseLength('invalid-value');
} catch (error) {
  console.error(error.message); // 出力: Failed to parse value: invalid-value
}
```

## 高度な文法ルール

その他の `GrammarRule` タイプを以下に示します。

### Sequence 文法ルール

特定の順序でルールを照合します。

```typescript
// 例: "1px 10% red" のようなボーダー定義を解析する
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
期待される AST:
{
  "type": "branch",
  "id": "root",
  "children": [
    {
      "type": "branch",
      "id": "myBorder",
      "children": [
        { "type": "branch", "id": "borderWidth", "children": [...] }, // 1px の leaf
        { "type": "branch", "id": "borderRadius", "children": [...] }, // 10% の leaf
        { "type": "branch", "id": "borderColor", "children": [...] }  // red の leaf
      ]
    }
  ]
}
*/
```

### Unordered 文法ルール

ルールを任意の順序で照合します。定義されたルールの一部のみが入力に存在する場合でも、正常に解析できます。

```typescript
// 例: 幅、色、スタイルが任意の順序で、一部が欠けていても解析できるボーダー
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

// 異なる順序の項目や欠けている項目を解析
const astUnordered1 = parseBorderUnordered('solid red 2px');
const astUnordered2 = parseBorderUnordered('5px dashed');
console.log(JSON.stringify(astUnordered1, null, 2));
console.log(JSON.stringify(astUnordered2, null, 2));
```

### Choice 文法ルール

複数の選択肢の中から正確に 1 つのルールを照合します。

```typescript
// 例: 長さまたはパーセンテージのいずれかを解析する
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

### Repetition 文法ルール

指定された回数、または無限に繰り返すことができるルールを照合します。

```typescript
// 例: 2 つから 4 つの長さの値を解析する（例: "1px 2px 3px"）
const multipleLengthsRule: GrammarRule = {
  id: 'myLengths',
  type: 'repetition<2,4>', // 2 回から 4 回繰り返す
  rule: { type: 'primitive', tokenType: 'length' },
};
const parseMultipleLengths = parserGenerator(multipleLengthsRule);
const astRepetition = parseMultipleLengths('1px 2px 3px');
console.log(JSON.stringify(astRepetition, null, 2));
```

これらの文法ルールタイプを理解することで、複雑なスタイル構文のための洗練されたパーサーを構築できます。

## さらに読む

-   [**構文設定**](syntax-config.md): `GrammarRule` の定義、利用可能な `tokenType`、および高度な設定の詳細について深く掘り下げます。
-   [**概要**](overview.md): パーサーのコアコンセプトとアーキテクチャを理解します。
