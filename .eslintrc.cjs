module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    "project": "./tsconfig.json",
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:prettier/recommended"
  ],
  rules: {
    "no-var": "error",
    "no-param-reassign": "error",
    "prefer-const": "error",
    "@typescript-eslint/prefer-readonly": "error",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/switch-exhaustiveness-check": "error",
    "@typescript-eslint/prefer-readonly-parameter-types": "off",
    "@typescript-eslint/no-misused-promises": "off",
    "@typescript-eslint/require-await": "off",
  },
  overrides: [
    {
      files: "./test/**/*.ts",
      parserOptions: {
        "project": "./tsconfig.test.json"
      },
      rules: {
        "@typescript-eslint/no-floating-promises": "error",
        "functional/no-method-signature": "off",
        "@typescript-eslint/prefer-readonly-parameter-types": "off",
        "functional/prefer-readonly-type": "off",
        "functional/immutable-data": "off"
      }
    }
  ]
};
