# Bubble UI Style Parser - Build Instructions

This document outlines the steps required to set up the development environment and build the Bubble UI Style Parser library.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

-   **Node.js**: It is recommended to use the latest LTS version. You can download it from [nodejs.org](https://nodejs.org/).
-   **npm** (Node Package Manager): This is typically installed with Node.js.

## Getting Started

Follow these steps to get the project up and running:

1.  **Clone the Repository (if you haven't already):**
    If you're working with the source directly, ensure you have the project files.

2.  **Install Dependencies:**
    Navigate to the project's root directory in your terminal and install the necessary dependencies using npm:

    ```bash
    npm install
    ```

    This command reads the `package.json` file and downloads all required packages.

3.  **Build the Library:**
    Once the dependencies are installed, you can build the library. This project uses [Vite](https://vitejs.dev/) as its build tool and is written in [TypeScript](https://www.typescriptlang.org/).

    To build the project, run the following command:

    ```bash
    npm run build
    ```

    This command executes the build script defined in `package.json`, which compiles the TypeScript source code (`src/` directory) and outputs the compiled JavaScript files to the `dist/` directory. The `--emptyOutDir` flag ensures that the output directory is cleaned before a new build.

## Development Commands

-   **Run Tests:** To execute the unit tests, use:
    ```bash
    npm test
    ```
    For a single, non-interactive test run:
    ```bash
    npm run test:once
    ```
-   **Linting:** To run the linter and check for code style issues:
    ```bash
    npm run lint
    ```
    To automatically fix linting issues (where possible):
    ```bash
    npm run lint:fix
    ```

By following these steps, you will have a successfully built version of the Bubble UI Style Parser library and be ready for development.
