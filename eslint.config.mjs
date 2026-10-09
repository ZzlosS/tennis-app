import { defineConfig } from "eslint/config";
import expoConfig from "eslint-config-expo/flat.js";
import prettier from "eslint-config-prettier";

export default defineConfig([
  expoConfig,
  prettier,
  {
    ignores: ["dist/*", ".expo/*", "node_modules/*", "coverage/*", "src/api/generated/*"],
  },
  {
    // All API calls go through src/api: no fetch() and no generated imports anywhere else.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/api/**"],
    rules: {
      "no-restricted-globals": [
        "error",
        { name: "fetch", message: "Call the API through hooks from @/api, not fetch()." },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["**/api/generated/**", "@/api/generated/**"], message: "Import from @/api instead." },
            { group: ["@/api/http", "@/api/tokens"], message: "Import from @/api instead." },
          ],
        },
      ],
    },
  },
]);
