import { isFunction, uuid } from './utils'

// Worker script will be injected at build time
declare const __WORKER_SCRIPT__: string

interface Message {
  type: 'add' | 'remove' | 'clear' | 'invoke'
  name?: string
  code?: string
  id?: string
  params?: unknown[]
}

interface WorkerResponse {
  id: string
  data: unknown
  name: string
}

export class FuncWork {
  #worker: Worker
  #scriptUrl: string
  #methods = new Set<string>()
  #pending = new Map<string, { resolve: (value: unknown) => void, reject: (reason: Error) => void }>()

  constructor(options?: WorkerOptions) {
    if (typeof window === 'undefined') {
      throw new TypeError('FuncWork only works in browser environment.')
    }

    if (!window.Worker) {
      throw new Error('Web Worker is not supported in this environment.')
    }

    if (!window.URL || !URL.createObjectURL) {
      throw new Error('URL API is not supported in this environment.')
    }

    if (!window.Promise) {
      throw new Error('Promise is not supported in this environment.')
    }

    this.#scriptUrl = URL.createObjectURL(new Blob([__WORKER_SCRIPT__], { type: 'application/javascript' }))
    this.#worker = new Worker(this.#scriptUrl, options)
    this.#worker.onmessage = this.#handleMessage.bind(this)
  }

  #handleMessage(event: MessageEvent<string>): void {
    try {
      const response: WorkerResponse = JSON.parse(event.data)
      const { id, data } = response
      const pending = this.#pending.get(id)
      if (pending) {
        this.#pending.delete(id)
        if (data && typeof data === 'object' && 'error' in data) {
          pending.reject(new Error(String(data.error)))
        }
        else {
          pending.resolve(data)
        }
      }
    }
    catch {
      // Ignore invalid messages
    }
  }

  #postMessage(message: Message): void {
    this.#worker.postMessage(JSON.stringify(message))
  }

  #genCodeString(method: Function): string {
    const funcCode = Function.prototype.toString.call(method)
    return `(function(){return ${funcCode}})()`
  }

  add(...methods: Function[]): this {
    for (let i = 0; i < methods.length; i++) {
      const method = methods[i]
      if (!isFunction(method)) {
        console.warn(`Registration failed: methods[${i}] is not a Function.`)
        continue
      }

      const name = method.name
      if (!name || name.trim() === '') {
        console.warn(`Registration failed: methods[${i}] is an anonymous function.`)
        continue
      }

      if (this.#methods.has(name)) {
        console.warn(`Registration failed: methods[${i}] (${name}) is already registered.`)
        continue
      }

      this.#methods.add(name)
      this.#postMessage({
        type: 'add',
        name,
        code: this.#genCodeString(method),
      })
    }
    return this
  }

  remove(name: string | Function): void {
    const fnName = isFunction(name) ? name.name : name
    if (!this.#methods.has(fnName))
      return

    this.#methods.delete(fnName)
    this.#postMessage({ type: 'remove', name: fnName })
  }

  clear(): void {
    this.#methods.clear()
    this.#postMessage({ type: 'clear' })
  }

  list(): string {
    return [...this.#methods].join(' | ')
  }

  invoke(name: string | Function, params?: unknown[]): Promise<unknown> {
    const fnName = isFunction(name) ? name.name : name
    if (!this.#methods.has(fnName)) {
      throw new Error(`${fnName} is not registered in FuncWork.`)
    }

    const id = uuid()
    const args = Array.isArray(params) ? params : params ? [params] : []

    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject })
      this.#postMessage({ type: 'invoke', name: fnName, params: args, id })

      // Timeout fallback
      setTimeout(() => {
        if (this.#pending.has(id)) {
          this.#pending.delete(id)
          reject(new Error(`Timeout: ${fnName} did not respond in time.`))
        }
      }, 30000)
    })
  }

  destroy(): void {
    this.#worker.terminate()
    URL.revokeObjectURL(this.#scriptUrl)
    this.#methods.clear()
    this.#pending.forEach(({ reject }) => reject(new Error('FuncWork instance destroyed.')))
    this.#pending.clear()
  }
}
