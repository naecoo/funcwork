export const isFunction = (val: any): val is Function => typeof val === 'function';

export const isArrowFunction = (val: any): boolean => {
  if (!isFunction(val)) return false;
  if (val.prototype && val.prototype.constructor === val) {
    return false
  }
  if (Function.prototype.toString.call(val).indexOf('function') !== 0) {
    return true
  }
  try {
    new val()
    return false
  } catch (e) {
    return true
  }
}