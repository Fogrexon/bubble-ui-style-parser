# Bubble UI Style Parser - 構文設定

Bubble UI Style Parser は、`GrammarRule` オブジェクトを使用してカスタム文法を定義するための堅牢で柔軟なメカニズムを提供します。このドキュメントでは、目的のスタイル構文を解析するためのこれらのルールを構築する方法について詳しく説明します。

## `GrammarRule` の理解

`GrammarRule` は、特定の構文構造を記述するプレーンな JavaScript オブジェクトです。`GrammarRule` のインスタンスを `parserGenerator` に渡して、パーサー関数を作成します。

すべての `GrammarRule` オブジェクトは、2 つの共通プロパティを共有します。

-   `id: string`: このルールの一意の識別子です。この `id` は、生成された AST の対応する「ブランチ」ノードの `id` として使用されます。
-   `type: 'primitive' | 'sequence' | 'unordered' | 'choice' | 'repetition'`: 文法ルールの種類を指定し、入力とどのように一致するかを決定します。

各 `type` について詳しく見ていきましょう。

### `primitive` 文法ルール

`primitive` ルールは最も基本的なタイプであり、単一のアトミック値を解析する役割を担います。これらのルールは、内部のアトミックトークンパーサーを活用して、生の文字列値を AST の構造化された `leaf` ノードに変換します。

-   **必須プロパティ**:
    -   `tokenType: string`: 使用するアトミックトークンパーサーを指定する文字列です。この文字列には制約を含めることもできます。

#### 利用可能なアトミックトークンタイプと例

`tokenType` 文字列は、特定のデータ型用に設計された様々な内部パーサーにマップされます。生成された AST の `leaf` ノードは、`type: 'leaf'` とベースのアトミックタイプ（例：`'length'`、`'color'`）に一致する `tokenType` を持ちます。

| `tokenType` 文字列            | 入力例                 | AST `leaf` ノードの例                                                                   | 説明                                                              |
| :---------------------------- | :--------------------- | :---------------------------------------------------------------------------------------- | :---------------------------------------------------------------- |
| `'length'`                    | `"10px"`, `"2em"`, `"5"` | `{ value: 10, unit: "px" }`, `{ value: 2, unit: "em" }`, `{ value: 5, unit: "" }`         | オプションの CSS 単位を持つ数値を解析します。                     |
| `'percentage'`                | `"50%"`                | `{ value: 50, unit: "%" }`                                                                | パーセント記号が続く数値を解析します。                            |
| `'integer'`                   | `"100"`, `"-50"`       | `{ value: 100 }`, `{ value: -50 }`                                                        | 整数を解析します。                                                |
| `'color'`                     | `"#ff0000"`, `"rgb(255, 0, 0)"`, `"rgba(255, 0, 0, 1)"` | `{ value: "#ff0000" }`, `{ value: "rgb(255, 0, 0)" }`, `{ value: "rgba(255, 0, 0, 1)" }` | 標準的な CSS カラー形式を解析します。                             |
| `'image'`                     | `"url(image.png)"`     | `{ value: "image.png" }`                                                                  | 画像パスの `url(...)` または `url("...")` を解析します。           |
| `'keyword'`                   | `"solid"`, `"auto"`    | `{ value: "solid" }`, `{ value: "auto" }`                                                 | 一般的な文字列キーワードを解析します。                            |

#### 制約付き `tokenType`

`tokenType` 文字列に制約を適用して、解析できる値をさらに制限できます。

-   **数値型（例：`length`、`percentage`、`integer`）の範囲**:
    -   構文: `tokenType<min,max>`
    -   例: `tokenType: 'length<0,100>'` は、0 から 100 までの長さの値（両端を含む）のみを解析します。
    -   例: `tokenType: 'integer<10,>'` は、10 以上の整数を解析します。
    -   例: `tokenType: 'percentage<,50>'` は、50 以下のパーセンテージを解析します。

-   **`'keyword'` タイプで許可されるキーワード**:
    -   構文: `keyword<val1,val2,...>`
    -   例: `tokenType: 'keyword<solid,dashed,dotted>'` は、「solid」、「dashed」、「dotted」のみを解析します。

**制約付き `primitive` ルールの例**:

```typescript
const constrainedLengthRule: GrammarRule = {
  id: 'constrainedLength',
  type: 'primitive',
  tokenType: 'length<0,100>', // 0 から 100 までの長さのみを解析
};

const specificKeywordRule: GrammarRule = {
  id: 'lineStyle',
  type: 'primitive',
  tokenType: 'keyword<solid,dashed>', // 「solid」または「dashed」のみを解析
};
```

### `sequence` 文法ルール

`sequence` ルールは、他の `GrammarRule` の順序付けられたリストと一致します。`sequence` ルールが成功するには、すべてのサブルールが指定された順序で一致する必要があります。

-   **必須プロパティ**:
    -   `rules: GrammarRule[]`: 順次一致する必要がある `GrammarRule` オブジェクトの配列です。

**例**:

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
// このルールは "1px solid red" とは一致しますが、"solid 1px red" とは一致しません。
```

### `unordered` 文法ルール

`unordered` ルールは、他の `GrammarRule` のリストと一致しますが、順序は関係ありません。入力に定義されたルールの一部のみが存在する場合でも、正常に解析できます。

-   **必須プロパティ**:
    -   `rules: GrammarRule[]`: 任意の順序で一致できる `GrammarRule` オブジェクトの配列です。

**例**:

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
// このルールは "1px solid red"、"solid 1px red"、"red 1px" などと一致します。
```

### `choice` 文法ルール

`choice` ルールは、サブルールのうち 1 つだけと一致しようとします。入力の解析に成功した最初のサブルールが選択されます。

-   **必須プロパティ**:
    -   `rules: GrammarRule[]`: 正確に 1 つが一致する必要がある `GrammarRule` オブジェクトの配列です。

**例**:

```typescript
const dimensionRule: GrammarRule = {
  id: 'dimension',
  type: 'choice',
  rules: [
    { id: 'lengthValue', type: 'primitive', tokenType: 'length' },
    { id: 'percentageValue', type: 'primitive', tokenType: 'percentage' },
  ],
};
// このルールは "10px" または "50%" と一致しますが、"10px 50%" とは一致しません。
```

### `repetition` 文法ルール

`repetition` ルールは、単一の `GrammarRule` を指定された回数、または無限に繰り返すことを許可します。

-   **必須プロパティ**:
    -   `rule: GrammarRule`: 繰り返す必要がある単一の `GrammarRule` です。
-   **オプションプロパティ**:
    -   `min?: number`: 繰り返しの最小回数（両端を含む）。指定しない場合、デフォルトは 0 です。
    -   `max?: number`: 繰り返しの最大回数（両端を含む）。指定しない場合、繰り返しは無限です。

-   **`type` の構文**: `type` 文字列で min/max を直接指定することもできます。
    -   `type: 'repetition<min,max>'`（例: 1 回から 4 回繰り返す場合は `'repetition<1,4>'`）
    -   `type: 'repetition<min,>'`（例: 2 回以上繰り返す場合は `'repetition<2,>'`）
    -   `type: 'repetition<,max>'`（例: 最大 3 回繰り返す場合は `'repetition<,3>'`）
    -   数字が指定されていない場合（例: `'repetition'`）、デフォルトは 0 回以上の繰り返し（無限）です。

**例**:

```typescript
const fourLengthsRule: GrammarRule = {
  id: 'fourLengths',
  type: 'repetition<4,4>', // 正確に 4 つの長さ
  rule: { id: 'lengthItem', type: 'primitive', tokenType: 'length' },
};

const atLeastOneLengthRule: GrammarRule = {
  id: 'atLeastOneLength',
  type: 'repetition<1,>', // 1 つ以上の長さ
  rule: { id: 'lengthItem', type: 'primitive', tokenType: 'length' },
};
// fourLengthsRule は "1px 2px 3px 4px" と一致しますが、"1px 2px" とは一致しません。
// atLeastOneLengthRule は "1px"、"1px 2px" などと一致します。
```

これらの `GrammarRule` タイプを組み合わせ、`primitive` ルールとそれらのアトミックトークンタイプおよび制約の力を活用することで、様々なスタイル定義を解析するための非常に表現力豊かで正確な文法を定義できます。
