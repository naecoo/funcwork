# funcwork
run javascript function in web worker


### 安装
```javascript
  yarn add funcwork
```

### 使用
```javascript
import funcwork form 'funcwork'

const { add, invoke, terminate } = funcwork()

function sayName (name) {
  return `Hello ${name}!`
}

const sayHi () {
  return 'Hi!'
}

async function requestInfo (url, id) {
    return fetch(url, {id})
}

add(sayName, sayHi)

await invoke('sayName', ['naeco'])    						  // Hello naeco!
await invoke('sayHi')                 						  // Hi!
await invoke('requestInfo', ['api/getUserInfo', 'xxx123456']) //  user info...
```

### 参数

| 参数    | 说明                                                         |
| ------- | ------------------------------------------------------------ |
| options | 调用funcwork时传入，与实例化[worker的配置](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API/Using_web_workers)一致 |

### 方法

| 方法名    | 说明                 | 参数                     | 返回值       |
| --------- | -------------------- | ------------------------ | ------------ |
| add       | 添加函数到worker里面 | [func,...]               | ---          |
| invoke    | 调用worker里面的函数 | [funcName,  [params...]] | 函数执行结果 |
| terminate | 销毁worker实例       | ---                      | ---          |

### 注意事项

1. add方法传入的函数不能是匿名函数
2. 函数之间不能互相调用，即函数内部不能调用别的函数（下一步可能会优化）
3. 函数内部不能访问worker访问不到的对象，比如window,location等等
4. invoke返回值是promise