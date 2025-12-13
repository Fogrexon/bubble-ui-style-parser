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
