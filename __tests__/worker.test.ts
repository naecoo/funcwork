import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { handleMessage } from '../src/worker'

const mockPostMessage = vi.fn()
const mockEval = vi.fn()

vi.stubGlobal('postMessage', mockPostMessage)
vi.stubGlobal('eval', mockEval)

describe('worker', () => {
  beforeEach(() => {
    mockPostMessage.mockClear()
    mockEval.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('handleMessage add', () => {
    it('should add function to methodsMap via eval', () => {
      const mockFunction = () => 'test'
      mockEval.mockReturnValue(mockFunction)

      handleMessage({
        data: JSON.stringify({
          type: 'add',
          name: 'testFunc',
          code: 'mock code',
        }),
      } as MessageEvent)

      expect(mockEval).toHaveBeenCalledWith('(function(){return mock code})()')
    })
  })

  describe('handleMessage remove', () => {
    it('should remove function from methodsMap', () => {
      mockEval.mockReturnValue(() => 'test')

      handleMessage({
        data: JSON.stringify({
          type: 'add',
          name: 'testFunc',
          code: 'mock code',
        }),
      } as MessageEvent)

      mockEval.mockClear()

      handleMessage({
        data: JSON.stringify({
          type: 'remove',
          name: 'testFunc',
        }),
      } as MessageEvent)

      expect(mockEval).not.toHaveBeenCalled()
    })
  })

  describe('handleMessage clear', () => {
    it('should reset methodsMap', () => {
      mockEval.mockReturnValue(() => 'test')

      handleMessage({
        data: JSON.stringify({
          type: 'add',
          name: 'testFunc',
          code: 'mock code',
        }),
      } as MessageEvent)

      mockEval.mockClear()

      handleMessage({
        data: JSON.stringify({
          type: 'clear',
        }),
      } as MessageEvent)

      expect(mockEval).not.toHaveBeenCalled()
    })
  })

  describe('handleMessage invoke', () => {
    it('should call invoke function and post sync result', async () => {
      mockEval.mockReturnValue(() => 'sync result')

      handleMessage({
        data: JSON.stringify({
          type: 'add',
          name: 'testFunc',
          code: 'mock code',
        }),
      } as MessageEvent)

      mockEval.mockClear()

      handleMessage({
        data: JSON.stringify({
          type: 'invoke',
          name: 'testFunc',
          params: ['arg1'],
          id: 'test-id',
        }),
      } as MessageEvent)

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
        return new Promise(resolve => setTimeout(resolve, 10, 'async result'))
      }
      mockEval.mockReturnValue(asyncFunc)

      handleMessage({
        data: JSON.stringify({
          type: 'add',
          name: 'asyncFunc',
          code: 'mock code',
        }),
      } as MessageEvent)

      handleMessage({
        data: JSON.stringify({
          type: 'invoke',
          name: 'asyncFunc',
          params: [],
          id: 'async-id',
        }),
      } as MessageEvent)

      await new Promise(resolve => setTimeout(resolve, 20))

      expect(mockPostMessage).toHaveBeenCalledWith(
        JSON.stringify({
          data: 'async result',
          name: 'asyncFunc',
          id: 'async-id',
        }),
      )
    })

    it('should post error for unregistered function', async () => {
      handleMessage({
        data: JSON.stringify({
          type: 'invoke',
          name: 'nonexistent',
          params: [],
          id: 'error-id',
        }),
      } as MessageEvent)

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(mockPostMessage).toHaveBeenCalledWith(
        JSON.stringify({
          data: { error: 'Function nonexistent is not registered.' },
          name: '',
          id: 'error-id',
        }),
      )
    })
  })
})
