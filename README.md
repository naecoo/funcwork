# funcwork
[🍵](https://emojipedia.org/teacup-without-handle/) Run pure function in Web Worker easily. Allows add functions to Web Worker dynamically, there are no preset `.js` files.

[online demo](https://naecoo.github.io/funcwork/)

## Why

This package help you use `Web Worker` in a human way.



## Install

```console
npm i funcwork
```



## Usage

### base

```js
import { FuncWork } from 'funcwork'

const fw = new FuncWork()
const add = (a, b) => a + b
fw.add(add)

// The `add` function will be running in Web Worker.
// So you can do other things in main process.
fw.invoke(add, [1, 1]).then((result) => {
  console.log(result) // 2
})
```

### add multiple functions

```js
import { FuncWork } from 'funcwork'

const fw = new FuncWork()
const add = (a, b) => a + b
function sub(a, b) {
  return a - b
}
fw.add(add, sub)
```

### invoke

```js
import { FuncWork } from 'funcwork'

const fw = new FuncWork()
const add = (a, b) => a + b
fw.add(add)
fw.invoke(add, [1, 1]).then((result) => {
  console.log(result) // 2
})

// or
fw.invoke('add', [1, 2]).then((result) => {
  console.log(result) // 3
})

// recommended way
(async () => {
  try {
    const result = await fw.invoke('add', [1, 3])
    console.log(result) // 4
  }
  catch (err) {
    // It may be an exception thrown by the Web Worker, or the process of function execution
    console.log(err)
  }
})()
```

### destroy

```js
import { FuncWork } from 'funcwork'

const fw = new FuncWork()

// ...

// Destroy Funcwork instance, it will clear all function and terminate Web Worker instance.
fw.destroy()
```



## API

### Class
#### Funcwork

- Arguments

  - options: `Web Worker` options, get detail [here](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)

- Returns

  `Funcwork` instance

- Usage

  Create `Funcwork` instance

  ```js
  import { FuncWork } from 'funcwork'
  
  const fw = new FuncWork()
  // or
  const fw = new FuncWork({
    credentials: '',
    name: '',
    type: ''
  })
  ```

  

### Instance Methods
#### add

- Arguments

  - { Function }	fn

- Returns

  this

- Usage

  Add function to `Web Worker`

  ```javascript
  import { FuncWork } from 'funcwork';
  
  const fw = new FuncWork();
  
  function add (a, b) {
      return a + b;
  }
  fw.add(add);
  fw.add(function sub(a, b) { return a - b});
  
  
  // multiple
  const f3 = () => { 
  	// ... 
  };
  fw.add(function f1() {}, function f2, f3);
  
  // Chain calls
  fw.add(function f4() {})
     .add(function f5() {});
  ```

#### invoke

- Arguments

  - { string | Function }	name
  - { Array } params

- Returns

  - Promise<data>	`data` is the result returned after the function is executed

- Usage

  Call the registered function

  ```javascript
  import { FuncWork } from 'funcwork';
  
  const fw = new FuncWork();
  
  function add (a, b) {
      return a + b;
  }
  fw.add(add);
  
  fw.inoke(add, [1, 2]).then(data => {
      console.log(data); // 3
  })
  fw.invoke('add', [1, 3]).then(data => {
      console.log(data); // 4
  })
  ```

  

#### remove

- Arguments

  - { string | Function }	name

- Returns

- Usage

  Remove a registered function

  ```javascript
  import { FuncWork } from 'funcwork';
  
  const fw = new FuncWork();
  function add (a, b) { return a + b; }
  fw.add(add);
  
  fw.remove('add');
  // or
  fw.remove(add)
  
  fw.invoke(add) // throw new Error('add is not defined in Funcwork.')
  ```

#### clear

- Arguments

- Returns

- Usage

  Clear all registered functions

  ```javascript
  import { FuncWork } from 'funcwork';
  
  const fw = new FuncWork();
  function add (a, b) { return a + b; }
  fw.add(add);
  
  fw.clear();
  fw.invoke(add) // throw new Error('add is not defined in Funcwork.')
  ```

#### list

- Arguments

- Returns

- Usage

  List all registered functions

  ```javascript
  import { FuncWork } from 'funcwork';
  
  const fw = new FuncWork();
  
  function add (a, b) { return a + b; }
  function sub(a, b) { return a - b; }
  fw.add(add, sub);
  fw.list(); // "add | sub"
  ```

#### destroy

- Arguments

- Returns

- Usage

  Clear all function and terminate Web Worker instance.

  ```javascript
  import { FuncWork } from 'funcwork';
  
  const fw = new FuncWork();
  // do something...
  
  fw.destroy();
  ```

  



