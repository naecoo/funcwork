import { isFunction, isArrowFunction } from './utils';

export class FuncWork {
  private options?: WorkerOptions;
  private worker?: Worker;
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
    return `${code};self.onmessage=function(e){var data=JSON.parse(e.data);var method=data.method;var params=data.params;try{var result=self[method].call(null,params)||null;if(result instanceof Promise){Promise.resolve(result).then(res=>{self.postMessage(JSON.stringify(res))}).catch(e=>{throw new Error(e)})}else{self.postMessage(JSON.stringify(result))}}catch(e){throw new Error(e)}};`;
  }

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
    this.terminate();
    const code = this.genCodeString();
    this.scriptUrl = URL.createObjectURL(new Blob([code]));
    this.worker = new Worker(this.scriptUrl, this.options);

    return this;
  }

  list(): String {
    const result: string[] = [];
    this.methodMap.forEach((_, k) => {
      result.push(k);
    });
    return result.join(' | ');
  }

  remove(name: string): boolean {
    if (!this.methodMap.has(name)) return false;
    try {
      this.methodMap.delete(name);
    } catch (e) {
      return false;
    }
    return true;
  }

  invoke(name: string, params: any): never | Promise<any> {
    if (!this.methodMap.has(name)) {
      throw new Error(`${name} is not defined in Funcwork.`);
    }
    return new Promise((resolve, reject) => {
      this.worker?.addEventListener('message', (e) => {
        try {
          resolve(JSON.parse(e.data))
        } catch (e) {
          reject(e);
        }
      });
      this.worker?.addEventListener('error', (e) => {
        reject(e);
      });
      this.worker?.postMessage(JSON.stringify({
        method: name,
        params
      }))
    });
  }

  clear() {
    this.methodMap.clear();
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