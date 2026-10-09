const expoPreset = require("jest-expo/jest-preset");

// Packages that ship only ES modules and must go through Babel (MSW and its helpers).
const esmPackages = [
  "msw",
  "@mswjs",
  "rettime",
  "until-async",
  "@bundled-es-modules",
  "@open-draft",
  "outvariant",
  "strict-event-emitter",
  "headers-polyfill",
  "@faker-js",
];

module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    // msw/node hides itself from the react-native export condition jest-expo resolves with.
    "^msw/node$": "<rootDir>/node_modules/msw/lib/node/index.js",
  },
  transformIgnorePatterns: expoPreset.transformIgnorePatterns.map((pattern, i) =>
    i === 0 ? pattern.replace("(?!(", `(?!(${esmPackages.join("|")}|`) : pattern,
  ),
  // The preset only transforms .js/.ts; some of those packages ship .mjs files.
  transform: {
    ...expoPreset.transform,
    "\\.mjs$": expoPreset.transform["\\.[jt]sx?$"],
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  // The first screen test in each file builds the whole router tree, which is slow on CI runners.
  testTimeout: 20_000,
};
