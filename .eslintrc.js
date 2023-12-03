/**
 * This is intended to be a basic starting point for linting in the Blues Stack.
 * It relies on recommended configs out of the box for simplicity, but you can
 * and should modify this configuration to best suit your team's needs.
 */

/** @type {import('eslint').Linter.Config} */
module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
  },
  // Base config
  extends: ["eslint:recommended"],
  ignorePatterns: ["./cypress", "./cypress.config.ts"],
  overrides: [
    // React
    {
      extends: [
        "plugin:react/recommended",
        "plugin:react/jsx-runtime",
        "plugin:react-hooks/recommended",
        "plugin:jsx-a11y/recommended",
        "prettier",
      ],
      files: ["**/*.{js,jsx,ts,tsx}"],
      plugins: ["react", "jsx-a11y"],
      rules: {
        "react/jsx-no-leaked-render": ["warn", { validStrategies: ["ternary"] }],
        "react/prop-types": "off",
      },
      settings: {
        formComponents: ["Form"],
        linkComponents: [
          { linkAttribute: "to", name: "Link" },
          { linkAttribute: "to", name: "NavLink" },
        ],
        react: {
          version: "detect",
        },
      },
    },

    // Typescript
    {
      extends: [
        "plugin:@typescript-eslint/recommended-type-checked",
        "plugin:@typescript-eslint/stylistic",
        "plugin:import/recommended",
        "plugin:import/typescript",
        "prettier",
      ],
      files: ["**/*.{ts,tsx}"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
      plugins: ["@typescript-eslint", "import"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/array-type": ["error", { default: "generic" }],
        "@typescript-eslint/no-unused-vars": ["error", { varsIgnorePattern: "^_" }],
        "@typescript-eslint/no-misused-promises": [
          "error",
          {
            checksVoidReturn: false,
          },
        ],
        "@typescript-eslint/no-unnecessary-condition": "warn",
        "import/order": [
          "error",
          {
            alphabetize: { caseInsensitive: true, order: "asc" },
            groups: ["builtin", "external", "internal", "parent", "sibling"],
            "newlines-between": "always",
          },
        ],
      },
      settings: {
        "import/internal-regex": "^~/",
        "import/resolver": {
          node: {
            extensions: [".ts", ".tsx"],
          },
          typescript: {
            alwaysTryTypes: true,
          },
        },
      },
    },

    // Markdown
    {
      extends: ["plugin:markdown/recommended", "prettier"],
      files: ["**/*.md"],
      plugins: ["markdown"],
    },

    // Jest/Vitest
    {
      env: {
        "jest/globals": true,
      },
      extends: ["plugin:jest/recommended", "plugin:jest-dom/recommended", "plugin:testing-library/react", "prettier"],
      files: ["**/*.test.{js,jsx,ts,tsx}"],
      plugins: ["jest", "jest-dom", "testing-library"],
      settings: {
        jest: {
          // we're using vitest which has a very similar API to jest
          // (so the linting plugins work nicely), but it means we have to explicitly
          // set the jest version.
          version: 28,
        },
      },
    },

    // Cypress
    {
      extends: ["plugin:cypress/recommended", "prettier"],
      files: ["cypress/**/*.ts"],
      plugins: ["cypress"],
    },

    // Node
    {
      env: {
        node: true,
      },
      files: [".eslintrc.js", "mocks/**/*.js"],
    },
  ],

  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: "latest",
    sourceType: "module",
  },

  root: true,
};
