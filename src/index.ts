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
    return `(function(){return ${funcCode}})()`;
  }

  private updateWorker(message: Message) {
    this.worker.postMessage(JSON.stringify(message));
  }

  private terminate() {
    URL.revokeObjectURL(this.scriptUrl);
    this.scriptUrl = '';
    if (this.worker) {
      this.worker.terminate();
    }
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
    // @ts-ignore
    this.scriptUrl = URL.createObjectURL(new Blob([__WORKER_SCRIPT__]));
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

  invoke(name: string | Function, params?: any[]): Promise<any> | never {
    if (isFunction(name)) {
      name = name.name;
    }
    if (!this.methodSet.has(name)) {
      throw new Error(`${name} is not defined in Funcwork.`);
    }

    const uid = uuid();

    return new Promise((resolve, reject) => {
      const onResolve = (ev: MessageEvent<string>) => {
        this.worker.removeEventListener('message', onResolve);
        this.worker.removeEventListener('error', onReject);
        try {
          const { id, data } = JSON.parse(ev.data);
          if (id === uid) {
            resolve(data)
          }
        } catch (e) {
          reject(e);
        }
      };

      const onReject = (err: ErrorEvent) => {
        this.worker.removeEventListener('message', onResolve);
        this.worker.removeEventListener('error', onReject);
        reject(err);
      };

      // refactor: register event listener once
      this.worker.addEventListener('message', onResolve);
      this.worker.addEventListener('error', onReject);

      this.updateWorker({
        type: 'invoke',
        name: (name as string),
        params: Array.isArray(params) ? params : [params],
        id: uid
      });
    });
  }

  destroy() {
    this.terminate();
    this.clear();
  }
}