module.exports = {
  extends: [
    'eslint:recommended',
    '@electron-toolkit/eslint-config-ts/recommended',
    '@electron-toolkit/eslint-config-prettier'
  ]
}

/*
root: true
env:
  'es2021': true
parserOptions:
  ecmaVersion: 2022
  ecmaFeatures: {}
extends:
  - airbnb-base
  - prettier
plugins:
  - html
settings:
  import/core-modules: [electron]
rules:
  no-console: 'off'
  no-restricted-syntax:
    - error
    - selector: >-
        CallExpression[callee.object.name='console'][callee.property.name!=/^(log|warn|error|info|trace)$/]
      message: Unexpected property on console object was called
  no-underscore-dangle: ['error', { 'allowAfterThis': true }]
 */
