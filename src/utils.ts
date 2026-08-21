export const isFunction = (val: unknown): val is Function => typeof val === 'function'

export const uuid = (): string => `${Date.now()}${Math.random().toString(36).slice(2, 7)}`
