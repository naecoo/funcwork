const {
  add,
  invoke,
  terminate
} = worker()

const fn1 = (a, b) => {
  const old = +new Date
  let now = old
  while (now - old < 1000) {
    now = +new Date
  }
  return a + b
}

const fn2 = (...args) => {
  return args ?
    args.length > 1 ?
    args.reduce((sum, n) => sum + n) :
    args[0] :
    null
}

const fn3 = (a) => {
  return {
    a: a
  }
}

const testInWorker = () => {
  return window
}

add(fn1, fn2, fn3, testInWorker)