import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  ignores: ['dist', 'docs/.vitepress/dist', 'docs/.vitepress/cache', 'AGENTS.md', 'README.md/**'],
}, {
  files: ['**/*.md/**'],
  rules: {
    'style/max-statements-per-line': 'off',
  },
}, {
  files: ['src/**/*.ts'],
  rules: {
    // Core library design: functions are serialized and re-created via eval inside the Worker
    'no-eval': 'off',
    'ts/no-unsafe-function-type': 'off',
  },
})
