import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-plugin-prettier";

export default tseslint.config(
  {
    ignores: [
      "node_modules",
      "dist",
      "build",
      "coverage",
      "*.log",
      "*.lock",
      "vite.config.*",
      "*.snap",
      "frontend/old-src",
      "temp",
      ".tmp",
      "backend/**/__pycache__",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["frontend/**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      prettier,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      semi: "off",
      "prettier/prettier": "warn",
      "react/react-in-jsx-scope": "off",
    },
  }
);
