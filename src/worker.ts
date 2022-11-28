type fn = (...args: any[]) => any
let methodsMap: Record<string, fn> = {}

function invoke(name: string, params: unknown[], id: string) {
  try {
    if (!methodsMap[name])
      throw new Error(`function ${name} is not registered.`)

    const result = methodsMap[name].apply(null, params)
    Promise.resolve(result).then((res) => {
      self.postMessage(JSON.stringify({
        data: res,
        name,
        id,
      }))
    }).catch((error) => {
      throw error
    })
  }
  catch (error) {
    throw error
  }
}

self.onmessage = function (e) {
  const data = JSON.parse(e.data)
  const type = data.type
  const name = data.name

  switch (type) {
    case 'add':
      methodsMap[name] = eval(data.code)
      break

    case 'remove':
      if (methodsMap[name])
        delete methodsMap[name]

      break

    case 'clear':
      methodsMap = {}
      break

    case 'invoke':
      var params = data.params
      var id = data.id
      invoke(name, params, id)
      break
  }
}
