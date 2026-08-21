interface Message {
  type: 'add' | 'remove' | 'clear' | 'invoke'
  name?: string
  code?: string
  id?: string
  params?: unknown[]
}

type WorkerFunction = (...args: unknown[]) => unknown

const methodsMap = new Map<string, WorkerFunction>()

function postMessage(data: { data: unknown, name: string, id: string }): void {
  globalThis.postMessage(JSON.stringify(data))
}

function postError(id: string, message: string): void {
  postMessage({ data: { error: message }, name: '', id })
}

function invoke(name: string, params: unknown[], id: string): void {
  const fn = methodsMap.get(name)
  if (!fn) {
    postError(id, `Function ${name} is not registered.`)
    return
  }

  try {
    const result = fn(...params)
    Promise.resolve(result).then(
      res => postMessage({ data: res, name, id }),
      err => postError(id, err instanceof Error ? err.message : String(err)),
    )
  }
  catch (err) {
    postError(id, err instanceof Error ? err.message : String(err))
  }
}

export function handleMessage(e: MessageEvent<string>): void {
  try {
    const msg: Message = JSON.parse(e.data)
    const { type, name, code, id, params } = msg

    switch (type) {
      case 'add':
        if (name && code) {
          methodsMap.set(name, eval(`(function(){return ${code}})()`))
        }
        break

      case 'remove':
        if (name) {
          methodsMap.delete(name)
        }
        break

      case 'clear':
        methodsMap.clear()
        break

      case 'invoke':
        if (name && id) {
          invoke(name, params ?? [], id)
        }
        break
    }
  }
  catch {
    // Ignore parse errors
  }
}

// Auto-setup for production
if (typeof globalThis !== 'undefined') {
  globalThis.onmessage = handleMessage
}
