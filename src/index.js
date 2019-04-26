function funcworker (options = {}) {
  let _worker, url

  const _methods = new Map()

  const _getFnName = (func) => func.name

  const _fnToStr = Function.prototype.toString

  const worker_scheduler = `
    self.onmessage = function (e) {
      const { method, params = [] } = JSON.parse(e.data)
      self.postMessage(JSON.stringify(methods[method].apply(null, params)))
    } 
  `

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
      code += `${name}: ${_fnToStr.call(func)},`
    }
    const wrapper = `const methods = {${code}}` + `\n${worker_scheduler}`
    
    url = URL.createObjectURL(new Blob([wrapper]))
    _worker = new Worker(url, options)

  }

  function invoke (method = '', params = []) {
    if (!_methods.has(method)) {
      throw new Error(`${method} is not defined`)
    }
    return new Promise((resolve, reject) => {
      _worker.onmessage = (e) => {
        resolve(JSON.parse(e.data))
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
    URL.revokeObjectURL(url)
    _methods.clear()
    add = null
    invoke = null
  }

  return {
    add,
    invoke,
    terminate
  }
}

export default funcworker