# Gemini CLI Instructions for Bubble UI

## Project Overview
Bubble UI Style Parser is a library for parsing style definitions.

## Project Structure
- `src/`: Source code for the library
- `api-docs/`: Documentation for the API

## Coding Conventions
- Use TypeScript for all new code.
- Use arrow functions for standalone function definitions instead of traditional function declarations. Class methods can use the standard method syntax.
- Follow existing code style and patterns.
- Comment public functions and classes with JSDoc.
- Minimize inline comments; use them only for complex logic that JSDoc cannot adequately explain. Rely primarily on JSDoc for documenting functions, classes, and types.
- Maintain type safety.
- Write unit tests for new functionality.
- Avoid adding unnecessary comments or blank lines.

## Interaction Preferences
- Respond in Japanese in chat.
- Write code comments in English.
- Create all temporary files for task execution in the `llm-workspace/` directory.

## Development Workflow
The development process is centered around GitHub Issues and Pull Requests.
1. Check or create a GitHub Issue for the task. Ensure tasks are granular and separate issues are created for distinct features or changes.
   - **Issue Creation Guidelines:**
     - Follow the project's Issue Template located at `.github/ISSUE_TEMPLATE/issue_template.md` (Overview, Problem, Request).
     - Write descriptions from the perspective of the **issue creator**. Use appropriate politeness but avoid being overly humble.
2. Make changes to the source code.
3. Run tests to ensure functionality.
4. Update documentation if needed. Regular documentation should be placed in the `docs/` directory. API documentation is automatically generated from the source code and does not require manual creation.
5. Submit a Pull Request linked to the Issue.
   - **PR Creation Guidelines:**
     - Follow the project's Pull Request Template located at `.github/pull_request_template.md`.

## Dependencies
- TypeScript for type checking
- Jest for testing
- Pixi.js v8 for rendering (as per Copilot instructions)

# 💻 Git Worktree を使用した同一リポジトリ内での開発手順

`git worktree` 機能を利用すると、既存のリポジトリに対して追加の作業ツリーを作成し、現在の作業を中断せずに別のブランチで並行して開発を行うことができます。

## 1\. 作業ブランチの準備

追加の作業ツリーでチェックアウトしたいブランチを用意します。

1.  **メインの作業ツリーに移動し、ブランチを確認します。**
    ```bash
    # 現在の作業ツリーにいることを確認
    git status
    ```
2.  **(オプション)** 新しい作業用ブランチを作成します。
    ```bash
    # (例: ホットフィックス用のブランチを作成)
    git branch feature/hotfix-20251213
    ```

## 2\. 新しい作業ツリーの追加

`git worktree add` コマンドを使用して、新しいディレクトリを作成し、そこに指定したブランチをチェックアウトします。

### コマンド構文

```bash
git worktree add <新しいディレクトリのパス> <チェックアウトしたいブランチ名>
```

### 実行例

元のリポジトリ（例: `my-project`）と同じ階層に `hotfix-work` というディレクトリを作成し、`feature/hotfix-20251213` ブランチをチェックアウトする場合。

```bash
# (実行する場所は元のリポジトリディレクトリ内でも、その親ディレクトリでも構いません)
git worktree add ../hotfix-work feature/hotfix-20251213
```

> ⚠️ **注意点:** 指定したパスにディレクトリが存在しない場合、自動的に作成されます。

## 3\. 追加された作業ツリーでの開発

新しく作成されたディレクトリに移動し、通常の開発作業を行います。

1.  **新しい作業ツリーに移動します。**
    ```bash
    cd ../hotfix-work
    ```
2.  **ファイルの編集、コミット、プッシュなどを行います。**
    ```bash
    # 緊急の修正を行う
    # ...
    git add .
    git commit -m "Fix: Urgent issue resolved (worktree)"
    git push origin feature/hotfix-20251213
    ```
3.  **作業が完了したら、元の作業ツリーに戻ります。**
    ```bash
    cd ../my-project # 元のリポジトリディレクトリ
    ```

## 4\. 作業ツリーの一覧表示

現在、リポジトリに追加されている作業ツリーを確認できます。

```bash
git worktree list
```

### 出力例

```
/path/to/my-project       xxxxxxxx [main]       # メインの作業ツリー
/path/to/hotfix-work      xxxxxxxx [feature/hotfix-20251213]
```

## 5\. 作業ツリーの削除（クリーンアップ）

追加での作業が不要になったら、作業ツリーを削除してクリーンアップします。

1.  **削除したい作業ツリーのディレクトリから移動します。**（メインの作業ツリーなどへ）
    ```bash
    cd /path/to/my-project
    ```
2.  **`git worktree remove` コマンドを実行します。**
    ```bash
    git worktree remove /path/to/hotfix-work
    ```

> 📌 **重要:** 削除対象の作業ツリーに**未コミットの変更がある場合**は削除に失敗します。その際は、変更をコミットするか、スタッシュするか、または `-f` オプション（強制削除）を使用してください。