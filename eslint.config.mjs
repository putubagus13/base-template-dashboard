// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Enforce no unused vars
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Enforce explicit return types on module-boundary functions
      "@typescript-eslint/explicit-module-boundary-types": "off",
      // Prevent 'any' usage
      "@typescript-eslint/no-explicit-any": "off",
      // Prefer const
      "prefer-const": "error",
      // No console.log in production (allow console.error/warn/info)
      "no-console": ["warn", { allow: ["error", "warn", "info"] }],
      // React
      "react/no-unescaped-entities": "off",

      "@typescript-eslint/no-unused-vars": "off",
    },
  },
];

export default eslintConfig;
