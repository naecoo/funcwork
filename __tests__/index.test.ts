import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { uuid } from '../src/utils'

// Mock the injected __WORKER_SCRIPT__
;(global as any).__WORKER_SCRIPT__ = 'mock worker script'

import { FuncWork } from '../src/index'

describe('FuncWork', () => {
  let mockWorker: any
  let mockUrl: any
  let consoleWarnSpy: any

  beforeEach(() => {
    // Mock console.warn
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    // Mock URL
    mockUrl = {
      createObjectURL: vi.fn(() => 'mock-url'),
      revokeObjectURL: vi.fn(),
    }
    vi.stubGlobal('URL', mockUrl)

    // Mock Worker
    mockWorker = {
      postMessage: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      terminate: vi.fn(),
    }

    // Create a constructor function for Worker
    const MockWorker = function () {
      return mockWorker
    }
    vi.stubGlobal('Worker', MockWorker)

    // Ensure window and Promise are available
    vi.stubGlobal('window', {
      Worker: MockWorker,
      URL: mockUrl,
      Promise: global.Promise,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
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
      expect(() => new FuncWork()).toThrow('Detected not in browser environment.')
    })

    it('should throw error if Worker is not supported', () => {
      vi.stubGlobal('window', { ...global.window, Worker: undefined })
      expect(() => new FuncWork()).toThrow('Web Worker is not supported in the environment.')
    })

    it('should throw error if URL API is not supported', () => {
      vi.stubGlobal('window', { ...global.window, URL: undefined })
      vi.stubGlobal('URL', { createObjectURL: undefined })
      expect(() => new FuncWork()).toThrow('URL API is not supported in the environment.')
    })

    it('should throw error if Promise is not supported', () => {
      vi.stubGlobal('window', {
        ...global.window,
        Promise: undefined,
        Worker: global.Worker,
        URL: global.URL,
      })
      expect(() => new FuncWork()).toThrow('Promise Feature is not supported in the environment.')
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
      expect(consoleWarnSpy).toHaveBeenCalledWith('Registration failed, methods[0] is not a Function type.')
      expect(mockWorker.postMessage).not.toHaveBeenCalled()
    })

    it('should warn for anonymous functions', () => {
      funcwork.add(() => {})
      expect(consoleWarnSpy).toHaveBeenCalledWith('Registration failed, methods[0] is a anonymous function.')
    })

    it('should warn for duplicate function names', () => {
      function testFunc() {}
      funcwork.add(testFunc)
      funcwork.add(testFunc)
      expect(consoleWarnSpy).toHaveBeenCalledWith('Registration failed, methods[0] is already registered.')
    })

    it('should return this for chaining', () => {
      function testFunc() {}
      expect(funcwork.add(testFunc)).toBe(funcwork)
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
      expect(() => funcwork.invoke('nonexistent')).toThrow('nonexistent is not defined in Funcwork.')
    })

    it('should send invoke message and handle success response', async () => {
      function testFunc() {}
      funcwork.add(testFunc)

      // Mock successful response
      mockWorker.postMessage.mockImplementation((message) => {
        const parsed = JSON.parse(message)
        if (parsed.type === 'invoke') {
          const uid = parsed.id
          // Find the message handler
          const messageHandler = mockWorker.addEventListener.mock.calls.find(call => call[0] === 'message')?.[1]
          if (messageHandler) {
            setTimeout(() => {
              messageHandler({ data: JSON.stringify({ id: uid, data: 'result' }) })
            }, 0)
          }
        }
      })

      const result = await funcwork.invoke('testFunc')
      expect(result).toBe('result')
      expect(mockWorker.postMessage).toHaveBeenCalledWith(
        expect.stringContaining('"type":"invoke"'),
      )
    })

    it('should handle error response', async () => {
      function testFunc() {}
      funcwork.add(testFunc)

      // Mock error response
      mockWorker.addEventListener.mockImplementation((event, handler) => {
        if (event === 'error') {
          setTimeout(() => {
            handler(new Error('Worker error'))
          }, 0)
        }
      })

      await expect(funcwork.invoke('testFunc')).rejects.toThrow('Worker error')
    })
  })

  describe('destroy', () => {
    let funcwork: FuncWork

    beforeEach(() => {
      funcwork = new FuncWork()
    })

    it('should terminate worker and clear methods', () => {
      function testFunc() {}
      funcwork.add(testFunc)
      funcwork.destroy()
      expect(mockWorker.terminate).toHaveBeenCalled()
      expect(mockUrl.revokeObjectURL).toHaveBeenCalledWith('mock-url')
      expect(mockWorker.postMessage).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'clear',
        }),
      )
    })
  })
})
