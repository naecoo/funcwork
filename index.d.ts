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
   * @param methods The functions to be registered
   */
  add(...methods: Function[]): this;

  /**
   * remove function that was registered before
   * @param name The function or the name of the function to be removed
   */
  remove(name: string | Function): boolean;

  /** 
   * invoke function that was registered before
   * @param name The function or the name of the function to be called
   * @param params The parameters that the function accepts, it must be of array type, whether single argument or multiple arguments
   */
  invoke(name: string | Function, params?: any): never | Promise<any>

  /**
   * clear all functions
   */
  clear(): void;

  /**
   * list all registered functions
   */
  list(): string;

  /**
   * terminate the Web Worker instance but reserve functions
   */
  terminate(): void;

  /**
   * destroy Funcwork instance and clear all data
   */
  destroy(): void;
}
