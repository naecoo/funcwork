import { isFunction, uuid } from './utils';


type MessageType = 'add' | 'remove' | 'clear' | 'invoke'; 
interface Message {
  type: MessageType;
  name?: string;
  code?: string;
  id?: string;
  params?: any;
}
export class FuncWork {
  private worker: Worker;
  private scriptUrl: string;
  private methodSet: Set<string>;
  
  private genCodeString(method: Function): string {
    const funcCode = Function.prototype.toString.call(method);
    return `(${funcCode})`;
  }

  private updateWorker(message: Message) {
    this.worker.postMessage(JSON.stringify(message));
  }

  constructor(options?: WorkerOptions) {
    if (!window) {
      throw new Error('Detected not in browser environment.');
    }
    if (!window.Worker) {
      throw new Error('Web Worker is not supported in the environment.');
    }
    if (!window.URL && !URL.createObjectURL) {
      throw new Error('URL API is not supported in the environment.');
    }
    if (!window.Promise) {
      throw new Error('Promise Feature is not supported in the environment.');
    }

    this.methodSet = new Set();
    const code = `self.methodsMap={};self.onmessage=function(e){function invoke(name,params,id){try{if(!self.methodsMap[name]){throw new Error('function '+name+' is not registered.')}var result=self.methodsMap[name].apply(null,params)||null;if(result instanceof Promise){Promise.resolve(result).then(function(res){self.postMessage(JSON.stringify({data:res,name:name,id:id}))}).catch(function(e){throw new Error(e)})}else{self.postMessage(JSON.stringify({data:result,name:name,id:id}))}}catch(e){throw new Error(e)}}var data=JSON.parse(e.data);var type=data.type;var name=data.name;switch(type){case'add':eval('self.methodsMap["'+name+'"]='+data.code);break;case'remove':if(self.methodsMap[name]){self.methodsMap[name]=undefined}break;case'clear':self.methodsMap={};break;case'invoke':var params=data.params;var id=data.id;invoke(name,params,id);break;default:break}};`;
    this.scriptUrl = URL.createObjectURL(new Blob([code]));
    this.worker = new Worker(this.scriptUrl, options);
  }

  add(...methods: Function[]): this {
    methods.forEach((method, index) => {
      if (!isFunction(method)) {
        console.warn(`Registration failed, methods[${index}] is not a Function type.`);
        return;
      }
      const name = method.name;
      if (!name || name.trim() === '') {
        console.warn(`Registration failed, methods[${index}] is a anonymous function.`);
        return;
      }
      if (this.methodSet.has(name)) {
        console.warn(`Registration failed, methods[${index}] is already registered.`);
        return;
      }
      this.methodSet.add(name);
      this.updateWorker({
        name,
        type: 'add',
        code: this.genCodeString(method)
      });
    });
    return this;
  }

  remove(name: string | Function) {
    if (isFunction(name)) {
      name = name.name;
    }
    if (!this.methodSet.has(name)) return;
    this.methodSet.delete(name);
    this.updateWorker({
      type: 'remove',
      name
    });
  }

  clear() {
    this.methodSet.clear();
    this.updateWorker({
      type: 'clear'
    });
  }

  list(): String {
    const result: string[] = [];
    this.methodSet.forEach((k) => {
      result.push(k);
    });
    return result.join(' | ');
  }

  invoke(name: string | Function, params?: any[]): never | Promise<any> {
    if (isFunction(name)) {
      name = name.name;
    }
    if (!this.methodSet.has(name)) {
      throw new Error(`${name} is not defined in Funcwork.`);
    }

    const uid = uuid();
    return new Promise((resolve, reject) => {
      this.worker.addEventListener('message', (e) => {
        try {
          const { id, data } = JSON.parse(e.data);
          if (id === uid) {
            resolve(data)
          }
        } catch (e) {
          reject(e);
        }
      });
      this.worker.addEventListener('error', (e) => {
        reject(e);
      });
      this.updateWorker({
        type: 'invoke',
        name: (name as string),
        params: Array.isArray(params) ? params : [params],
        id: uid
      });
    });
  }

  terminate() {
    URL.revokeObjectURL(this.scriptUrl);
    this.scriptUrl = '';
    if (this.worker) {
      this.worker.terminate();
    }
  }

  destroy() {
    this.terminate();
    this.clear();
  }
}