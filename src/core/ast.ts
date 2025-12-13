import type { StaticPrimitiveToken } from './grammarRule';

export type LeafApplicableToken = StaticPrimitiveToken | 'keyword';

export type ASTLeaf<T extends string | number = string | number> = {
  type: 'leaf';
  tokenType: LeafApplicableToken;
  value: T;
  unit?: string;
};

export type ASTBranch = {
  type: 'branch';
  id: string;
  children: ASTNode[];
};

export type ASTNode = ASTBranch | ASTLeaf<string> | ASTLeaf<number>;
