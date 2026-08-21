import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FuncWork } from '../src/index'

describe('funcWork', () => {
  let mockWorker: Worker & {
    postMessage: ReturnType<typeof vi.fn>
    addEventListener: ReturnType<typeof vi.fn>
    removeEventListener: ReturnType<typeof vi.fn>
    terminate: ReturnType<typeof vi.fn>
    onmessage: ((event: MessageEvent) => void) | null
  }
  let mockUrl: { createObjectURL: ReturnType<typeof vi.fn>, revokeObjectURL: ReturnType<typeof vi.fn> }
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>
  let originalWindow: typeof window

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    mockUrl = {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    }

    mockWorker = {
      postMessage: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      terminate: vi.fn(),
      onmessage: null,
    } as any

    // Must be constructible, so `new Worker(...)` returns the mock instance
    const MockWorker = class {
      constructor() {
        return mockWorker
      }
    }

    originalWindow = globalThis.window
    vi.stubGlobal('window', {
      Worker: MockWorker,
      URL: mockUrl,
      Promise: globalThis.Promise,
      Blob: globalThis.Blob,
    })
    vi.stubGlobal('URL', mockUrl)
    vi.stubGlobal('Worker', MockWorker)
    vi.stubGlobal('Blob', globalThis.Blob)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    globalThis.window = originalWindow
  })

  describe('constructor', () => {
    it('should create FuncWork instance in browser environment', () => {
      const funcwork = new FuncWork()
      expect(funcwork).toBeInstanceOf(FuncWork)
      expect(mockUrl.createObjectURL).toHaveBeenCalled()
      expect(mockWorker).toBeDefined()
    })

    it('should throw error if not in browser environment', () => {
      vi.stubGlobal('window', undefined)
      expect(() => new FuncWork()).toThrow('FuncWork only works in browser environment.')
    })

    it('should throw error if Worker is not supported', () => {
      vi.stubGlobal('window', { ...globalThis.window, Worker: undefined })
      expect(() => new FuncWork()).toThrow('Web Worker is not supported in this environment.')
    })

    it('should throw error if URL API is not supported', () => {
      vi.stubGlobal('window', { ...globalThis.window, URL: undefined })
      vi.stubGlobal('URL', { createObjectURL: undefined })
      expect(() => new FuncWork()).toThrow('URL API is not supported in this environment.')
    })

    it('should throw error if Promise is not supported', () => {
      vi.stubGlobal('window', {
        ...globalThis.window,
        Promise: undefined,
        Worker: globalThis.Worker,
        URL: globalThis.URL,
      })
      expect(() => new FuncWork()).toThrow('Promise is not supported in this environment.')
    })
  })

  describe('add', () => {
    let funcwork: FuncWork

    beforeEach(() => {
      funcwork = new FuncWork()
    })

    it('should add named functions successfully', () => {
      function testFunc() {}
      funcwork.add(testFunc)
      expect(mockWorker.postMessage).toHaveBeenCalledWith(
        expect.stringContaining('"type":"add"'),
      )
    })

    it('should warn for non-function inputs', () => {
      funcwork.add('not a function' as any)
      expect(consoleWarnSpy).toHaveBeenCalledWith('Registration failed: methods[0] is not a Function.')
      expect(mockWorker.postMessage).not.toHaveBeenCalled()
    })

    it('should warn for anonymous functions', () => {
      funcwork.add(() => {})
      expect(consoleWarnSpy).toHaveBeenCalledWith('Registration failed: methods[0] is an anonymous function.')
    })

    it('should warn for duplicate function names', () => {
      function testFunc() {}
      funcwork.add(testFunc)
      funcwork.add(testFunc)
      expect(consoleWarnSpy).toHaveBeenCalledWith('Registration failed: methods[0] (testFunc) is already registered.')
    })

    it('should return this for chaining', () => {
      function testFunc() {}
      expect(funcwork.add(testFunc)).toBe(funcwork)
    })

    it('should add multiple functions at once', () => {
      function func1() {}
      function func2() {}
      funcwork.add(func1, func2)
      expect(mockWorker.postMessage).toHaveBeenCalledTimes(2)
    })
  })

  describe('remove', () => {
    let funcwork: FuncWork

    beforeEach(() => {
      funcwork = new FuncWork()
    })

    it('should remove function by name', () => {
      function testFunc() {}
      funcwork.add(testFunc)
      mockWorker.postMessage.mockClear()
      funcwork.remove('testFunc')
      expect(mockWorker.postMessage).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'remove',
          name: 'testFunc',
        }),
      )
    })

    it('should remove function by function reference', () => {
      function testFunc() {}
      funcwork.add(testFunc)
      mockWorker.postMessage.mockClear()
      funcwork.remove(testFunc)
      expect(mockWorker.postMessage).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'remove',
          name: 'testFunc',
        }),
      )
    })

    it('should do nothing if function not registered', () => {
      funcwork.remove('nonexistent')
      expect(mockWorker.postMessage).not.toHaveBeenCalled()
    })
  })

  describe('clear', () => {
    let funcwork: FuncWork

    beforeEach(() => {
      funcwork = new FuncWork()
    })

    it('should clear all methods', () => {
      function testFunc() {}
      funcwork.add(testFunc)
      mockWorker.postMessage.mockClear()
      funcwork.clear()
      expect(mockWorker.postMessage).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'clear',
        }),
      )
    })
  })

  describe('list', () => {
    let funcwork: FuncWork

    beforeEach(() => {
      funcwork = new FuncWork()
    })

    it('should return pipe-separated list of method names', () => {
      function func1() {}
      function func2() {}
      funcwork.add(func1, func2)
      expect(funcwork.list()).toBe('func1 | func2')
    })

    it('should return empty string when no methods', () => {
      expect(funcwork.list()).toBe('')
    })
  })

  describe('invoke', () => {
    let funcwork: FuncWork

    beforeEach(() => {
      funcwork = new FuncWork()
    })

    it('should throw error for unregistered function', () => {
      expect(() => funcwork.invoke('nonexistent')).toThrow('nonexistent is not registered in FuncWork.')
    })

    it('should send invoke message and handle success response', async () => {
      function testFunc() {}
      funcwork.add(testFunc)

      mockWorker.postMessage.mockImplementation((message: string) => {
        const parsed = JSON.parse(message)
        if (parsed.type === 'invoke') {
          const uid = parsed.id
          setTimeout(() => {
            if (mockWorker.onmessage) {
              mockWorker.onmessage({
                data: JSON.stringify({ id: uid, data: 'result', name: 'testFunc' }),
              } as MessageEvent)
            }
          }, 0)
        }
      })

      const result = await funcwork.invoke('testFunc')
      expect(result).toBe('result')
      expect(mockWorker.postMessage).toHaveBeenCalledWith(
        expect.stringContaining('"type":"invoke"'),
      )
    })

    it('should handle async function results', async () => {
      function testFunc() {}
      funcwork.add(testFunc)

      mockWorker.postMessage.mockImplementation((message: string) => {
        const parsed = JSON.parse(message)
        if (parsed.type === 'invoke') {
          const uid = parsed.id
          setTimeout(() => {
            if (mockWorker.onmessage) {
              mockWorker.onmessage({
                data: JSON.stringify({ id: uid, data: 'async result', name: 'testFunc' }),
              } as MessageEvent)
            }
          }, 10)
        }
      })

      const result = await funcwork.invoke('testFunc', ['arg1', 'arg2'])
      expect(result).toBe('async result')
    })

    it('should handle error response from worker', async () => {
      function testFunc() {}
      funcwork.add(testFunc)

      mockWorker.postMessage.mockImplementation((message: string) => {
        const parsed = JSON.parse(message)
        if (parsed.type === 'invoke') {
          const uid = parsed.id
          setTimeout(() => {
            if (mockWorker.onmessage) {
              mockWorker.onmessage({
                data: JSON.stringify({ id: uid, data: { error: 'Worker error' }, name: 'testFunc' }),
              } as MessageEvent)
            }
          }, 0)
        }
      })

      await expect(funcwork.invoke('testFunc')).rejects.toThrow('Worker error')
    })

    it('should invoke with function reference', async () => {
      function testFunc() {}
      funcwork.add(testFunc)

      mockWorker.postMessage.mockImplementation((message: string) => {
        const parsed = JSON.parse(message)
        if (parsed.type === 'invoke') {
          const uid = parsed.id
          setTimeout(() => {
            if (mockWorker.onmessage) {
              mockWorker.onmessage({
                data: JSON.stringify({ id: uid, data: 'result', name: 'testFunc' }),
              } as MessageEvent)
            }
          }, 0)
        }
      })

      const result = await funcwork.invoke(testFunc)
      expect(result).toBe('result')
    })

    it('should handle params correctly', async () => {
      function testFunc() {}
      funcwork.add(testFunc)

      mockWorker.postMessage.mockImplementation((message: string) => {
        const parsed = JSON.parse(message)
        if (parsed.type === 'invoke') {
          expect(parsed.params).toEqual(['arg1', 'arg2'])
          const uid = parsed.id
          setTimeout(() => {
            if (mockWorker.onmessage) {
              mockWorker.onmessage({
                data: JSON.stringify({ id: uid, data: 'result', name: 'testFunc' }),
              } as MessageEvent)
            }
          }, 0)
        }
      })

      await funcwork.invoke('testFunc', ['arg1', 'arg2'])
    })
  })

  describe('destroy', () => {
    let funcwork: FuncWork

    beforeEach(() => {
      funcwork = new FuncWork()
    })

    it('should terminate worker and revoke script url', () => {
      function testFunc() {}
      funcwork.add(testFunc)
      funcwork.destroy()
      expect(mockWorker.terminate).toHaveBeenCalled()
      expect(mockUrl.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
      expect(funcwork.list()).toBe('')
    })

    it('should reject pending invocations', async () => {
      function testFunc() {}
      funcwork.add(testFunc)

      const pending = funcwork.invoke('testFunc')
      funcwork.destroy()

      await expect(pending).rejects.toThrow('FuncWork instance destroyed.')
    })
  })
})
