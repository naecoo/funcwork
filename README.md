# funcwork
[🍵](https://emojipedia.org/teacup-without-handle/) Run pure function in Web Worker easily. Allows add functions to Web Worker dynamically, there are no preset `.js` files.



## Why

This package help you use `Web Worker` in a human way.



## Install

```console
npm i funcwork
```



## Usage

### base

```js
import { FuncWork } from 'funcwork';

const fw = new FuncWork();
const add = (a, b) => a + b;
fw.add(add);

// The `add` function will be running in Web Worker.
// So you can do other things in main process.
fw.invoke(add, [1, 1]).then(result => {
  console.log(result); // 2
})
```

### add multiple functions

```js
import { FuncWork } from 'funcwork';

const fw = new FuncWork();
const add = (a, b) => a + b;
function sub(a, b) {
  return a - b;
}
fw.add(add, sub);
```

### invoke

```js
import { FuncWork } from 'funcwork';

const fw = new FuncWork();
const add = (a, b) => a + b;
fw.invoke(add, [1, 1]).then(result => {
  console.log(result); // 2
})

// or
fw.invoke('add', [1, 2]).then(result => {
  console.log(result); // 3
})

// recommended way
(async () => {
 try {
    const result = await fw.invoke('add', [1, 3]);
    console.log(result); // 4
 } catch (err) {
    // It may be an exception thrown by the Web Worker, or the process of function execution
    console.log(err);
 }
})()
```

### destroy

```js
import { FuncWork } from 'funcwork';

const fw = new FuncWork();

// ...

// Destroy Funcwork instance, it will clear all function and terminate Web Worker instance.
fw.destroy()
```



## API

### constructor

Create `Funcwork` instance

### add()

Add function to `Web Worker`

### invoke

Call the registered function

### remove

Remove a registered function

### clear

Clear all registered functions

### list

List all registered functions

### destroy

Clear all function and terminate Web Worker instance.



