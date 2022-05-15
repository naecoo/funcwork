
type fn = (...args: any[]) => any;
var methodsMap: Record<string, fn> = {};

function invoke(name: string, params: unknown[], id: string) {
  try {
    if (!methodsMap[name]) {
      throw new Error('function ' + name + ' is not registered.');
    }
    var result = methodsMap[name].apply(null, params);
    Promise.resolve(result).then(function onresolve(res) {
      self.postMessage(JSON.stringify({
        data: res,
        name: name,
        id: id
      }));
    }).catch(function onerror(error) {
      throw error;
    });
  } catch (error) {
    throw error;
  }
}

self.onmessage = function (e) {
  var data = JSON.parse(e.data);
  var type = data.type;
  var name = data.name;

  switch (type) {
    case 'add':
      methodsMap[name] = eval(data.code);
      break;

    case 'remove':
      if (methodsMap[name]) {
        delete methodsMap[name];
      }
      break;

    case 'clear':
      methodsMap = {};
      break;

    case 'invoke':
      var params = data.params;
      var id = data.id;
      invoke(name, params, id);
      break;
  }
};