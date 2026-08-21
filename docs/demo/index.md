# Live Demo

The demo below runs the **actual library source** in your browser. Click "Run on Main Thread" first and try to scroll while it computes — then run the same computation with FuncWork and notice the UI stays responsive.

<ClientOnly>
  <Playground />
</ClientOnly>

::: warning
Large values of `n` (> 40) will freeze your browser tab when running on the main thread. The Worker version keeps the UI usable — that's the whole point.
:::

## Source

```js
import { FuncWork } from 'funcwork'

function fib(n) {
  return n <= 1 ? n : fib(n - 1) + fib(n - 2)
}

const fw = new FuncWork()
fw.add(fib)

// Off main thread
const result = await fw.invoke(fib, [n])
```

<script setup>
import Playground from './Playground.vue'
</script>
