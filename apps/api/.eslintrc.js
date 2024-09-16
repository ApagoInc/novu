module.exports = {
  extends: ['../../.eslintrc.js'],
  rules: {
    'func-names': 'off',
    '@typescript-eslint/no-useless-constructor': 'warn',
    '@typescript-eslint/naming-convention': 'warn',
    '@typescript-eslint/no-empty-function': 'warn'
  },
  parserOptions: {
    project: './tsconfig.json',
    ecmaVersion: 2020,
    sourceType: 'module',
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: '*.spec.ts',
};
