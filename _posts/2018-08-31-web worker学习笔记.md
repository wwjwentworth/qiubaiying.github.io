---
layout:     post
date:       2018-08-19
author:     WWJ
header-img: img/post-bg-universe.jpg
catalog: true
tags: Web Worker
---

# webWorker
> 允许一段javascript代码运行在主线程之外的另一个线程。

**如何创建**
`index.js`
```javascript
const worker = new Worker("./task.js");
```
![enter image description here](https://image.ibb.co/m4qjhp/error.png)
在谷歌浏览器下会报错，原因是谷歌浏览不支持使用本地方式使用Web Worker，简单的方法就是在本地开启一个服务，方法只需全局安装`http-server`，然后在`index.js`对应的文件路径下启动服务

全局安装：npm install http-server -g
启动服务：http-server

`worker`是主线程与其他线程之间的通讯桥梁，主线程和其他线程可以通过
```javascript
onmessage：监听消息
postMessage:发送消息
```
案例如下
```
//主线程 index.js
var worker = new Worker("worker.js");
worker.onmessage = function(event){
    // 主线程收到子线程的消息
};
// 主线程向子线程发送消息
worker.postMessage({
    type: "start",
    value: 12345
});

//web task.js
onmessage = function(event){
   // 收到
};
postMessage({
    type: "debug",
    message: "Starting processing..."
});
```

**如何终止**
如意我们不想再继续运行worker了，那么就可以在主线程中使用`worker.terminate()`或者在相应的其他线程使用`self.close()`

**错误机制**
```javascript
worker.onerror = function (error) {
 console.log(error.filename, error.lineno, error.message);
}
// error.filename：出错的脚步名称
// error.lineno：出错的行号
// error.message：错误信息
```
**shared worker**
> web worker只在当前页面下运行，一旦页面关闭就会终止，而shared worker可以同时在多个页面下使用，不会因为关闭了其中一个页面而终止运行

```javascript
const worker = new ShareWorker('./task.js')
```
共享线程也使用onmessge监听事件，使用postMessage发送数据
```javascript
worker.post.onmessage = function(){
	// code
}
worker.post.postMessage = function() {
	// code
}
```

### web worker与异步的区别
`web worker`是真正意义上的多线程，由`worker`开启的子线程与主线程互不干扰，也互不阻塞，而异步其实还是在主线程上运行，只不过是会先将异步的任务添加到事件队列中，等到主线程上没有任务了才会依次去执行事件队列里面的任务，如果异步任务被阻塞了，主线程也会被阻塞
