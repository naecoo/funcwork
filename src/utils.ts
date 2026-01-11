export const isFunction = (val: any): val is Function => typeof val === 'function'

export const uuid = () => `${Date.now()}${Math.random().toString().slice(10, 15)}`
