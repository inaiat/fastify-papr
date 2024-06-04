import eslint from '@eslint/js'
import functional from 'eslint-plugin-functional/flat'
import n from 'eslint-plugin-n'
import unicorn from 'eslint-plugin-unicorn'
import tseslint from 'typescript-eslint'

const customRules = {
  '@typescript-eslint/consistent-type-exports': 'error',
  '@typescript-eslint/consistent-type-imports': 'error',
  '@typescript-eslint/no-unused-vars': 'error',
  'no-console': 'error',

  'capitalized-comments': 'off',
  'new-cap': 'off',
  'n/no-missing-import': 'off',
  'unicorn/prevent-abbreviations': 'off',

  '@typescript-eslint/consistent-type-definitions': 'off',
  '@typescript-eslint/member-delimiter-style': 'off',
  '@typescript-eslint/prefer-readonly-parameter-types': 'off',
  '@typescript-eslint/naming-convention': 'off',
  '@typescript-eslint/no-unsafe-assignment': 'warn',
  '@typescript-eslint/object-curly-spacing': 'off',

  'n/no-unpublished-import': 'off',
  'unicorn/import-style': 'off',
  'unicorn/no-array-method-this-argument': 'off',
  'unicorn/no-array-callback-reference': 'off',

  'functional/prefer-readonly-type': 'off',
  'functional/no-classes': 'off',
  'functional/no-return-void': 'off',
  'functional/no-let': [
    'error',
    {
      'ignoreIdentifierPattern': '^mut(able|.*)_',
    },
  ],
  'functional/immutable-data': [
    'error',
    {
      'ignoreIdentifierPattern': '^mut(able|.*)_',
    },
  ],
}

const languageOptions = {
  parserOptions: {
    project: true,
  },
}

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  n.configs['flat/recommended-module'],
  unicorn.configs['flat/recommended'],
  functional.configs['lite'],
  {
    ignores: ['*.mjs', 'dist/', 'coverage/', 'report/'],
  },
  {
    languageOptions,
    rules: customRules,
  },
  {
    files: ['**/tests/**'],
    languageOptions,
    rules: {
      ...customRules,
      'no-console': 'off',
      'unicorn/no-await-expression-member': 'off',
      'unicorn/consistent-function-scoping': 'off',
    },
  },
)
