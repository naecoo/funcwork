<script setup lang="ts">
import { FuncWork } from 'funcwork'
import { onMounted, ref } from 'vue'

function fib(n) {
  return n <= 1 ? n : fib(n - 1) + fib(n - 2)
}

// Keep the instance out of Vue reactivity — Proxies break private fields (#worker)
let fw: FuncWork | null = null

onMounted(() => {
  fw = new FuncWork()
  fw.add(fib)
})

const n = ref(30)
const result = ref(null)
const workerMs = ref(0)
const mainMs = ref(0)
const running = ref(false)

async function run() {
  if (running.value || !fw)
    return
  running.value = true
  result.value = null

  const t0 = performance.now()
  const value = await fw.invoke(fib, [n.value])
  workerMs.value = performance.now() - t0

  result.value = value
  running.value = false
}

function runOnMain() {
  if (running.value)
    return
  running.value = true

  const t0 = performance.now()
  result.value = fib(n.value)
  mainMs.value = performance.now() - t0

  running.value = false
}
</script>

<template>
  <div class="demo">
    <div class="row">
      <label>
        n =
        <input v-model.number="n" type="number" min="1" max="42">
      </label>
      <button :disabled="running" @click="run">
        Run in Worker
      </button>
      <button :disabled="running" @click="runOnMain">
        Run on Main Thread (blocks UI)
      </button>
    </div>

    <div v-if="result !== null" class="result">
      <p><code>fib({{ n }}) = {{ result }}</code></p>
      <p v-if="workerMs > 0" class="ms">
        Worker: {{ workerMs.toFixed(1) }} ms — UI stayed responsive
      </p>
      <p v-if="mainMs > 0" class="ms warn">
        Main thread: {{ mainMs.toFixed(1) }} ms — UI was frozen during this time
      </p>
    </div>
    <p v-else-if="running" class="ms">
      Running…
    </p>
  </div>
</template>

<style scoped>
.demo {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px;
  margin: 16px 0;
}
.row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}
input {
  width: 80px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 4px 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}
button {
  border: 1px solid var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  border-radius: 20px;
  padding: 4px 16px;
  background: transparent;
  cursor: pointer;
}
button:hover:not(:disabled) {
  background: var(--vp-c-brand-soft);
}
.result {
  margin-top: 16px;
}
.ms {
  color: var(--vp-c-text-2);
  font-size: 14px;
}
.warn {
  color: var(--vp-c-warning-1);
}
</style>
