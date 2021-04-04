self.methodsMap = {};
self.onmessage = function (e) {
  function invoke(name, params, id) {
    try {
      if (!self.methodsMap[name]) {
        throw new Error('function ' + name + ' is not registered.')
      }
      var result = self.methodsMap[name].apply(null, params) || null;
      if (result instanceof Promise) {
        Promise.resolve(result).then(function (res) {
          self.postMessage(JSON.stringify({
            data: res,
            name: name,
            id: id
          }))
        }).
          catch(function (e) {
            throw new Error(e)
          })
      } else {
        self.postMessage(JSON.stringify({
          data: result,
          name: name,
          id: id
        }))
      }
    } catch (e) {
      throw new Error(e)
    }
  }
  var data = JSON.parse(e.data);
  var type = data.type;
  var name = data.name;

  switch (type) {
    case 'add':
      eval('self.methodsMap["' + name + '"]=' + data.code);
      break;
    case 'remove':
      if (self.methodsMap[name]) {
        self.methodsMap[name] = undefined;
      }
      break;
    case 'clear':
      self.methodsMap = {};
      break;
    case 'invoke':
      var params = data.params;
      var id = data.id;
      invoke(name, params, id);
      break;
    default:
      break;
  }
};