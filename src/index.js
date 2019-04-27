'use strict'
function funcwork (options = {}) {
  if (!Worker) {
    throw new Error('the current runtime does not support web worker')
  }
  if (!Promise) {
    throw new Error('the current runtime does not support Promise')
  }

  let _worker, _url

  const _methods = new Map()

  function add (...methods) {
    methods.forEach(method => {
      if (typeof method !== 'function') {
        throw new Error(`${method} should be a function`)
      }
      const name = _getFnName(method)
      _methods.set(name, method)
    })
    
    let code = ''
    for (const [name, func] of _methods.entries()) {
      let str = ''
      if (isArrowFunc(func)) {
        str = `;var ${name} = ${_fnToStr.call(func)}`
      } else {
        str = `;${_fnToStr.call(func)}`
      }
      code += str
    }

    const wrapper = `${code};\n${worker_scheduler}`
    _url = URL.createObjectURL(new Blob([wrapper]))
    _worker = new Worker(_url, options)

  }

  function invoke (method = '', params = []) {
    if (!_methods.has(method)) {
      throw new Error(`${method} is not defined`)
    }
    return new Promise((resolve, reject) => {
      _worker.onmessage = (e) => {
        const data = JSON.parse(e.data)
        resolve(data)
      }
      _worker.onerror = (e) => {
        reject(e.message)
      }
      _worker.postMessage(JSON.stringify({
        method,
        params
      }))
    })
  }

  function terminate () {
    if (_worker) {
      _worker.terminate()
      _worker = null
    }
    URL.revokeObjectURL(_url)
    _methods.clear()
  }

  return {
    add,
    invoke,
    terminate
  }
}

const worker_scheduler = `
    self.onmessage = function (e) {
      var data = JSON.parse(e.data)
      var method = data.method
      var params = data.params || []
      try {
        var result = self[method].apply(null, params)
        if (result instanceof Promise) {
          Promise.resolve(result).then(res => {
            self.postMessage(JSON.stringify(res))
          }).catch(e => {
            throw new Error(e)
          })
        } else {
          self.postMessage(JSON.stringify(result))
        }
      } catch (e) {
        throw new Error(e)
      }
    } 
  `

const isArrowFunc = (fn) => {
  if (typeof fn === 'function' && fn !== null) {
    if (fn.prototype && fn.prototype.constructor === fn) {
      return false
    }
    if (Function.prototype.toString.call(fn).indexOf('function') !== 0) {
      return true
    }
    try {
      new fn()
      return false
    } catch (e) {
      return true
    }
  }
  return false
}

const _getFnName = (func) => func.name

const _fnToStr = Function.prototype.toString

export default funcwork
