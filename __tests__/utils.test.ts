import { describe, expect, it } from 'vitest'
import { isFunction, uuid } from '../src/utils'

describe('isFunction', () => {
  it('should return true for function declarations', () => {
    function testFunc() {}
    expect(isFunction(testFunc)).toBe(true)
  })

  it('should return true for arrow functions', () => {
    const arrowFunc = () => {}
    expect(isFunction(arrowFunc)).toBe(true)
  })

  it('should return true for async functions', () => {
    const asyncFunc = async () => {}
    expect(isFunction(asyncFunc)).toBe(true)
  })

  it('should return false for objects', () => {
    expect(isFunction({})).toBe(false)
  })

  it('should return false for arrays', () => {
    expect(isFunction([])).toBe(false)
  })

  it('should return false for strings', () => {
    expect(isFunction('string')).toBe(false)
  })

  it('should return false for numbers', () => {
    expect(isFunction(42)).toBe(false)
  })

  it('should return false for null', () => {
    expect(isFunction(null)).toBe(false)
  })

  it('should return false for undefined', () => {
    expect(isFunction(undefined)).toBe(false)
  })
})

describe('uuid', () => {
  it('should return a string', () => {
    expect(typeof uuid()).toBe('string')
  })

  it('should generate unique IDs', () => {
    const id1 = uuid()
    const id2 = uuid()
    expect(id1).not.toBe(id2)
  })

  it('should generate IDs of reasonable length', () => {
    const id = uuid()
    expect(id.length).toBeGreaterThan(5)
  })
})
