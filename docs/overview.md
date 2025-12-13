# Bubble UI Style Parser - Overview

The Bubble UI Style Parser is a TypeScript library designed for parsing and transforming style definitions, converting them into an Abstract Syntax Tree (AST). This AST representation can then be used for various purposes, such as static analysis, code generation, or dynamic styling within UI frameworks.

## Key Features

-   **Modular Parsing:** The library employs a modular design, separating tokenization, atomic token parsing, and grammar rule application.
-   **Abstract Syntax Tree (AST) Generation:** It generates a structured AST from raw style input, making style definitions easily programmable and analyzable.
-   **Customizable Grammar Rules:** Users can define and apply custom grammar rules to parse various styling syntaxes, allowing for flexible adoption across different projects and design systems.
-   **Atomic Token Parsing:** Dedicated parsers handle atomic style elements (e.g., numbers, strings, units, colors), ensuring robust and accurate parsing of individual style values.

## Architecture Highlights

The core architecture revolves around the following key components:

-   **Tokenizer:** Breaks down the raw input string into a stream of meaningful tokens.
-   **Atomic Token Parsers:** A collection of specialized parsers for individual token types (e.g., `parseNumericValue`, `parseStringValue`, `parseColorValue`).
-   **Grammar Rules (`GrammarRule`):** Defines the hierarchical structure and relationships between different style elements, guiding the parsing process.
-   **Parser Generator (`ParserGenerator`):** Orchestrates the parsing process, applying the defined grammar rules to the token stream to construct the final AST.

This library is ideal for projects requiring dynamic style processing, theme management, or custom DSL (Domain Specific Language) for UI styling.
