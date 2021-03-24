export default function funcwork(options?: WorkerOptions): {
  add: (methods: string[]) => void;
  invoke: (method: string, params: any) => never | Promise<any>;
  terminate: () => void;
};