export class FuncWork {
  private options: WorkerOptions;
  private worker?: Worker;
  private scriptUrl: string;
  private methodMap: Map<string, Function>;

  private genCodeString(): string;

  /**
   * create FuncWork instance
   * @param options WorkerOptions
   */
  constructor(options?: WorkerOptions)

  /**
   * register function
   * @param methods
   */
  add(...methods: Function[]): this;

  /**
   * list all registered functions
   */
  list(): string;

  /**
   * remove function that was registered before
   * @param name function name
   */
  remove(name: string): boolean;

  /** 
   * invoke function that was registered before
   * @param name
   */
  invoke(name: string, params: any): never | Promise<any>

  /**
   * clear all method
   */
  clear(): void;

  /**
   * terminate the Web Worker instance
   */
  terminate(): void;

  /**
   * destroy Funcwork instance
   */
  destroy(): void;
}
