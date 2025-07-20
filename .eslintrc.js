module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    // Enforce consistent indentation
    'indent': ['error', 2],
    
    // Enforce consistent line endings
    'linebreak-style': ['error', 'unix'],
    
    // Enforce consistent quotes
    'quotes': ['error', 'single'],
    
    // Require semicolons
    'semi': ['error', 'always'],
    
    // Disallow console statements in production
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    
    // Disallow unused variables
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    
    // Enforce consistent spacing
    'space-before-function-paren': ['error', 'never'],
    
    // Enforce trailing commas
    'comma-dangle': ['error', 'never'],
    
    // Enforce consistent object curly spacing
    'object-curly-spacing': ['error', 'always'],
    
    // Enforce consistent array bracket spacing
    'array-bracket-spacing': ['error', 'never'],
    
    // Security rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    
    // Performance rules
    'no-loop-func': 'error',
    'no-new-object': 'error'
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.spec.js'],
      rules: {
        'no-console': 'off'
      }
    }
  ]
};