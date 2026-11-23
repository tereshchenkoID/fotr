import next from '@next/eslint-plugin-next'
import { defineConfig, globalIgnores } from 'eslint/config'
import react from 'eslint-plugin-react'
import hooks from 'eslint-plugin-react-hooks'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'

import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'

const eslintConfig = defineConfig([
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      '@next/next': next,
      '@stylistic': stylistic,
      react,
      'react-hooks': hooks,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,
      'react/jsx-uses-vars': 'error',
      'react/jsx-key': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^react', '^next', '^@next', '^[a-z]'],
            ['^@/i18n'],
            ['^@/constant'],
            ['^@/app/actions'],
            ['^@/context', '^@/hooks', '^@/store', '^@/utils', '^@/helpers', '^@/game', '^@/services'],
            ['^@/components', '^@/modules', '^@/widgets'],
            ['^@/sections.*/skeleton$', '^\\.\\.?/.*/skeleton$'],
            ['^@/sections', '^\\.\\./'],
            ['^\\./action'],
            ['^\\./(?!(index\\.module\\.scss|.*\\.css$))'],
            ['^.+\\.s?css$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
      '@stylistic/comma-spacing': ['error', { before: false, after: true }],
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/object-curly-newline': [
        'error',
        {
          ImportDeclaration: { multiline: true, minProperties: 4 },
          ExportDeclaration: { multiline: true, minProperties: 4 },
          ObjectExpression: { consistent: true },
          ObjectPattern: { consistent: true },
        },
      ],
      '@stylistic/indent': [
        'error',
        2,
        {
          SwitchCase: 1,
          ignoredNodes: [
            'JSXElement',
            'JSXElement *',
            'JSXFragment',
            'JSXFragment *',
            'ConditionalExpression',
            'JSXAttribute',
            'JSXExpressionContainer',
            'CallExpression > ObjectExpression',
          ],
        },
      ],
      '@stylistic/semi': ['error', 'never'],
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/jsx-quotes': ['error', 'prefer-double'],
    },
  },
  globalIgnores(['.next/**', 'out/**', 'coverage/**']),
])

export default eslintConfig
