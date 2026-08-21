# FuncWork

[![npm version](https://img.shields.io/npm/v/funcwork.svg)](https://www.npmjs.com/package/funcwork)
[![CI](https://github.com/naecoo/funcwork/actions/workflows/ci.yml/badge.svg)](https://github.com/naecoo/funcwork/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[🍵](https://emojipedia.org/teacup-without-handle/) Run pure functions in Web Worker easily. Add functions to a Web Worker dynamically — no preset worker files, no build config.

- 📖 **Docs**: https://naecoo.github.io/funcwork/
- ⚡️ **Live Demo**: https://naecoo.github.io/funcwork/demo/

## Why

Web Workers are powerful but verbose: you need a separate file, bundler wiring, message-passing boilerplate, and request/response id matching. FuncWork removes all of it — pass a function, get a Promise.

## Install

```bash
npm i funcwork
```

## Usage

```js
import { FuncWork } from 'funcwork'

const fw = new FuncWork()

function fib(n) {
  return n <= 1 ? n : fib(n - 1) + fib(n - 2)
}

fw.add(fib)

// Runs inside a Web Worker — the main thread stays free
const result = await fw.invoke(fib, [30])
console.log(result) // 832040
```

### Multiple functions & chaining

```js
fw.add(add, sub)
   .add(function mul(a, b) { return a * b })
```

### Invoke by name or reference

```js
await fw.invoke('add', [1, 2]) // 3
await fw.invoke(add, [1, 2])   // 3
```

### Async functions

The resolved value of a returned Promise is awaited automatically:

```js
async function fetchJson(url) {
  const res = await fetch(url)
  return res.json()
}

fw.add(fetchJson)
const data = await fw.invoke(fetchJson, ['https://api.example.com/data'])
```

### Error handling

Errors thrown inside the Worker reject the invocation Promise:

```js
try {
  await fw.invoke(riskyFn)
} catch (err) {
  console.error(err.message)
}
```

### Lifecycle

```js
fw.list()    // 'fib | add | sub'
fw.remove(add)
fw.clear()
fw.destroy() // terminate the Worker and release resources
```

See the [API Reference](https://naecoo.github.io/funcwork/guide/api.html) for details.

## Constraints

Functions are serialized via `Function.prototype.toString()` and re-created inside the Worker, so they must be:

- **Named** — declared as `function name()` (anonymous arrows cannot be registered)
- **Pure** — no closure over outer variables
- Connected only through arguments and return value
- Dependent only on globals available inside a Worker (`fetch`, `self`, etc.)

## Development

```bash
pnpm install

pnpm test          # run tests (vitest)
pnpm lint          # eslint
pnpm typecheck     # tsc
pnpm build         # build library (ESM / CJS / IIFE + types)

pnpm docs:dev      # docs site with live demo
pnpm docs:build    # build docs site
```

Built with [Vite](https://vite.dev) (Rolldown-powered), tested with [Vitest](https://vitest.dev), documented with [VitePress](https://vitepress.dev). Docs deploy to GitHub Pages on every push to `master`.

## License

[MIT](LICENSE)
