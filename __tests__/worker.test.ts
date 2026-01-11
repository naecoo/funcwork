import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Import after mocking
import '../src/worker'

// Mock self and eval before importing worker
const mockPostMessage = vi.fn()
const mockEval = vi.fn()
vi.stubGlobal('window', {
  self: {
    postMessage: mockPostMessage,
    onmessage: null, // Will be assigned by worker.ts
  },
})
vi.stubGlobal('eval', mockEval)
;(global as any).self.postMessage = mockPostMessage

describe('Worker', () => {
  beforeEach(() => {
    mockPostMessage.mockClear()
    mockEval.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('onmessage add', () => {
    it('should add function to methodsMap via eval', () => {
      const mockFunction = () => 'test'
      mockEval.mockReturnValue(mockFunction)

      ;(self as any).onmessage!({
        data: JSON.stringify({
          type: 'add',
          name: 'testFunc',
          code: 'mock code',
        }),
      })

      expect(mockEval).toHaveBeenCalledWith('mock code')
    })
  })

  describe('onmessage remove', () => {
    it('should remove function from methodsMap', () => {
      mockEval.mockReturnValue(() => 'test')

      ;(self as any).onmessage!({
        data: JSON.stringify({
          type: 'add',
          name: 'testFunc',
          code: 'mock code',
        }),
      })

      mockEval.mockClear()

      ;(self as any).onmessage!({
        data: JSON.stringify({
          type: 'remove',
          name: 'testFunc',
        }),
      })

      expect(mockEval).not.toHaveBeenCalled()
    })
  })

  describe('onmessage clear', () => {
    it('should reset methodsMap', () => {
      mockEval.mockReturnValue(() => 'test')

      ;(self as any).onmessage!({
        data: JSON.stringify({
          type: 'add',
          name: 'testFunc',
          code: 'mock code',
        }),
      })

      mockEval.mockClear()

      ;(self as any).onmessage!({
        data: JSON.stringify({
          type: 'clear',
        }),
      })

      expect(mockEval).not.toHaveBeenCalled()
    })
  })

  describe('onmessage invoke', () => {
    it('should call invoke function and post sync result', async () => {
      mockEval.mockReturnValue(() => 'sync result')

      ;(self as any).onmessage!({
        data: JSON.stringify({
          type: 'add',
          name: 'testFunc',
          code: 'mock code',
        }),
      })

      mockEval.mockClear()

      ;(self as any).onmessage!({
        data: JSON.stringify({
          type: 'invoke',
          name: 'testFunc',
          params: ['arg1'],
          id: 'test-id',
        }),
      })

      // Since invoke uses Promise.resolve, wait for async
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(mockPostMessage).toHaveBeenCalledWith(
        JSON.stringify({
          data: 'sync result',
          name: 'testFunc',
          id: 'test-id',
        }),
      )
    })

    it('should handle async function results', async () => {
      const asyncFunc = async () => {
        return new Promise(resolve => setTimeout(() => resolve('async result'), 10))
      }
      mockEval.mockReturnValue(asyncFunc)

      ;(self as any).onmessage!({
        data: JSON.stringify({
          type: 'add',
          name: 'asyncFunc',
          code: 'mock code',
        }),
      })

      ;(self as any).onmessage!({
        data: JSON.stringify({
          type: 'invoke',
          name: 'asyncFunc',
          params: [],
          id: 'async-id',
        }),
      })

      // Wait for async resolution
      await new Promise(resolve => setTimeout(resolve, 20))

      expect(mockPostMessage).toHaveBeenCalledWith(
        JSON.stringify({
          data: 'async result',
          name: 'asyncFunc',
          id: 'async-id',
        }),
      )
    })

    it('should throw error for unregistered function', () => {
      expect(() => {
        (self as any).onmessage!({
          data: JSON.stringify({
            type: 'invoke',
            name: 'nonexistent',
            params: [],
            id: 'error-id',
          }),
        })
      }).toThrow('function nonexistent is not registered.')
    })
  })
})
