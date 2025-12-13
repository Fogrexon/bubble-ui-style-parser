import type { StaticPrimitiveToken } from './grammarRule';

/**
 * Represents the possible token types that can be applied to an AST leaf node.
 * It includes static primitive tokens and the 'keyword' type.
 */
export type LeafApplicableToken = StaticPrimitiveToken | 'keyword';

/**
 * Represents a leaf node in the Abstract Syntax Tree (AST).
 * Leaf nodes are the terminal nodes of the tree and hold the actual parsed values.
 *
 * @template T The type of the value held by the leaf node. Can be a string or a number.
 */
export type ASTLeaf<T extends string | number = string | number> = {
  /** The type of the AST node, which is 'leaf' for leaf nodes. */
  type: 'leaf';
  /** The type of the token that this leaf node represents. */
  tokenType: LeafApplicableToken;
  /** The actual value of the token. */
  value: T;
  /** The unit of the value, if applicable (e.g., 'px', 'em'). */
  unit?: string;
};

/**
 * Represents a branch node in the Abstract Syntax Tree (AST).
 * Branch nodes are non-terminal nodes that group other nodes (branches or leaves).
 */
export type ASTBranch = {
  /** The type of the AST node, which is 'branch' for branch nodes. */
  type: 'branch';
  /** A unique identifier for the branch, often corresponding to a grammar rule. */
  id: string;
  /** An array of child nodes, which can be other branches or leaves. */
  children: ASTNode[];
};

/**
 * Represents any node in the Abstract Syntax Tree (AST).
 * It can be a branch node (`ASTBranch`) or a leaf node (`ASTLeaf`).
 */
export type ASTNode = ASTBranch | ASTLeaf<string> | ASTLeaf<number>;
