import { isFunction, isArrowFunction } from './utils';


type Message = 'init' | 'add' | 'remove' | 'clear'; 
export class FuncWork {
  private options?: WorkerOptions;
  // @ts-ignore
  private worker: Worker;
  private scriptUrl: string;
  private methodMap: Map<string, Function>;
  
  private genCodeString(): string {
    let code = '';
    for (const [name, method] of this.methodMap.entries()) {
      let str = '';
      const funcCode = Function.prototype.toString.call(method);
      if (isArrowFunction(method)) {
        str = `;var ${name} = ${funcCode}`;
      } else {
        str = `;${funcCode}`;
      }
      code = `${code}${str}`;
    }
    return `${code};self.onmessage=function(e){var data=JSON.parse(e.data);var method=data.method;var params=data.params;try{var result=self[method].apply(null,params)||null;if(result instanceof Promise){Promise.resolve(result).then(res=>{self.postMessage(JSON.stringify(res))}).catch(e=>{throw new Error(e)})}else{self.postMessage(JSON.stringify(result))}}catch(e){throw new Error(e)}};`;
  }

  private replaceWorker() {
    // todo: 初始化生成url和worker，维护一套消息机制，没必要重复生成
    this.terminate();
    const code = this.genCodeString();
    this.scriptUrl = URL.createObjectURL(new Blob([code]));
    this.worker = new Worker(this.scriptUrl, this.options);
  }

  private update(type: Message) {}

  constructor(options?: WorkerOptions) {
    // todo: 特性校验
    this.options = options;
    this.methodMap = new Map();
    this.scriptUrl = '';
  }

  add(...methods: Function[]): this {
    methods.forEach((method, index) => {
      if (!isFunction(method)) {
        console.warn(`Registration failed, methods[${index}] is not a Function type.`);
        return;
      }
      const name = method.name;
      if (!name || name.trim() === '') {
        console.warn(`Registration failed, methods[${index}] is anonymous function.`);
        return;
      }
      if (this.methodMap.has(name)) {
        console.warn(`Registration failed, methods[${index}] is already registered.`);
        return;
      }
      this.methodMap.set(name, method);
    });
    this.replaceWorker();
    return this;
  }

  remove(name: string | Function): boolean {
    if (isFunction(name)) {
      name = Function.prototype.toString.call(name);
    }
    if (!this.methodMap.has(name)) return false;
    try {
      this.methodMap.delete(name);
    } catch (e) {
      return false;
    }
    this.replaceWorker();
    return true;
  }

  invoke(name: string | Function, params?: any[]): never | Promise<any> {
    if (isFunction(name)) {
      name = Function.prototype.toString.call(name);
    }
    if (!this.methodMap.has(name)) {
      throw new Error(`${name} is not defined in Funcwork.`);
    }
    return new Promise((resolve, reject) => {
      this.worker.addEventListener('message', (e) => {
        try {
          resolve(JSON.parse(e.data))
        } catch (e) {
          reject(e);
        }
      });
      this.worker.addEventListener('error', (e) => {
        reject(e);
      });
      this.worker.postMessage(JSON.stringify({
        method: name,
        params: Array.isArray(params) ? params: [params]
      }))
    });
  }

  list(): String {
    const result: string[] = [];
    this.methodMap.forEach((_, k) => {
      result.push(k);
    });
    return result.join(' | ');
  }

  clear() {
    this.methodMap.clear();
    this.replaceWorker();
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