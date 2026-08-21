# API Reference

## `new FuncWork(options?)`

Creates a FuncWork instance and boots the underlying Web Worker.

- **options**: `WorkerOptions` (optional) — standard [Web Worker options](https://developer.mozilla.org/en-US/docs/Web/API/Worker/Worker) (`type`, `credentials`, `name`).

Throws if the environment lacks `window`, `Worker`, `URL.createObjectURL`, or `Promise`.

```js
const fw = new FuncWork()
```

---

## `fw.add(...methods)`

Registers one or more named functions in the Worker.

- **methods**: `Function[]`
- **Returns**: `this` (chainable)

Skips invalid input with a `console.warn`: non-functions, anonymous functions, and duplicate names.

```js
function fib(n) { /* ... */ }
fw.add(fib).add((a, b) => { return a * b })
```

---

## `fw.invoke(name, params?)`

Invokes a registered function inside the Worker.

- **name**: `string | Function` — function name or reference
- **params**: `unknown[]` (optional) — arguments passed to the function
- **Returns**: `Promise<unknown>` — resolves with the function's return value (async results are awaited); rejects with worker errors or timeouts

Throws synchronously if the function is not registered.

```js
await fw.invoke(fib, [10]) // 55
await fw.invoke('fib', [10]) // 55
```

---

## `fw.remove(name)`

Removes a registered function from the Worker.

- **name**: `string | Function`
- No-op if the name is not registered.

---

## `fw.clear()`

Removes **all** registered functions. The Worker itself stays alive.

---

## `fw.list()`

- **Returns**: `string` — all registered names joined with `' | '`, e.g. `'fib | add'`.

---

## `fw.destroy()`

Terminates the Worker, revokes the blob URL, clears registrations, and rejects any pending invocations. The instance should not be used afterwards.
