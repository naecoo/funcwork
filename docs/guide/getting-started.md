# Getting Started

FuncWork lets you run pure functions inside a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) without writing any worker files.

## Installation

```bash
npm i funcwork
```

## Basic Usage

Define a named function, register it, then invoke it — the call returns a Promise with the result:

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

::: tip
Functions must be **named** (declared with `function name()` or assigned so `.name` is set). Anonymous arrow functions cannot be serialized by name.
:::

## Register Multiple Functions

```js
function add(a, b) { return a + b }
function sub(a, b) { return a - b }

fw.add(add, sub)

// Chaining also works
fw.add((a, b) => { return a * b })
  .add((a, b) => { return a / b })
```

## Invoke by Name or Reference

```js
await fw.invoke('add', [1, 2]) // 3
await fw.invoke(add, [1, 2]) // 3
```

## Manage the Lifecycle

```js
fw.list() // 'fib | add | sub | mul | div'

fw.remove(add) // remove one function
fw.clear() // remove all functions
fw.destroy() // terminate the Worker and release resources
```

## Error Handling

Errors thrown inside the Worker are propagated to the Promise rejection:

```js
function risky() {
  throw new Error('boom')
}

fw.add(risky)
await fw.invoke(risky) // rejects with Error('boom')
```

Async functions are supported too — the resolved value is returned:

```js
async function fetchData(url) {
  const res = await fetch(url)
  return res.json()
}
```

## Constraints

Since functions are serialized via `Function.prototype.toString()` and re-created inside the Worker:

- They must be **pure** (no closure over outer variables).
- They can only communicate through their **arguments and return value** (structured-cloneable data).
- Referenced globals must exist in the Worker scope (`fetch`, `self`, etc. are available).
