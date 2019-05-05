# DocumentFragment的性能优化
在项目中遇到了需要往父级dom中插入很多个子元素的情况，一开始就是直接在父级dom上使用appendChild方法，将多个子元素插入进来

```javascript
const ownDom = document.createElement('div');
 
const goldenBorderDom = document.createElement('div');
const frontStarDom = document.createElement('img');
const backStarDom = document.createElement('img');
const whiteStarDom = document.createElement('img');
const goldrenBlockFirstDom = document.createElement('div');
const goldrenBlockSecDom = document.createElement('div');
 
(ownDom as HTMLElement).appendChild(frontStarDom);
(ownDom as HTMLElement).appendChild(backStarDom);
(ownDom as HTMLElement).appendChild(whiteStarDom);
(ownDom as HTMLElement).appendChild(goldenBorderDom);
(ownDom as HTMLElement).appendChild(goldrenBlockFirstDom);
(ownDom as HTMLElement).appendChild(goldrenBlockSecDom);
```
在code review之后了解到，如果在真实的DOM上使用appendChild这个方法，整个页面会发生回流，这是非常影响性能的操作

###DocumentFragment


----------

> DocumentFragment是DOM节点，它们不是主DOM树的一部分。通常的用法是创建文档片段，将元素添加到文档片段，最后将文档片段添加到DOM树中。添加到DOM树中之后，文档片段被其所有子元素替代；
> 
> 因为文档片段存在于内存中，而不存在于DOM树中，所以将元素插入到文档片段中并不会引起页面回流

### 创建documentFragment优化性能
```javascript
const ownDom = document.createElement('div');
const oFrag = document.createDocumentFragment();

const goldenBorderDom = document.createElement('div');
const frontStarDom = document.createElement('img');
const backStarDom = document.createElement('img');
const whiteStarDom = document.createElement('img');
const goldrenBlockFirstDom = document.createElement('div');
const goldrenBlockSecDom = document.createElement('div');

// 下面这段代码其实是往一个虚拟的DOM插入子元素，因为没有操作真实的DOM，所以页面不会发生回流
(oFrag as HTMLElement).appendChild(frontStarDom);
(oFrag as HTMLElement).appendChild(backStarDom);
(oFrag as HTMLElement).appendChild(whiteStarDom);
(oFrag as HTMLElement).appendChild(goldenBorderDom);
(oFrag as HTMLElement).appendChild(goldrenBlockFirstDom);
(oFrag as HTMLElement).appendChild(goldrenBlockSecDom);
 
// 只会进行一次回流，提升性能
(ownDom as HTMLElement).appendChild(oFrag);
```

### 添加到DOM树中之后，文档片段被其所有子元素替代

即当请求把一个DocumentFragment 节点插入文档树时，插入的不是 DocumentFragment 自身，而是它的所有子孙节点。这使得DocumentFragment 成了有用的占位符，暂时存放那些一次插入文档的节点

### 将真实的dom添加到文档片段中，真实的dom会被从dom树中移除
```vbscript-html

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Document</title>
</head>
<body>
  <div></div>
  <ul>
    <li>1</li>
    <li>2</li>
  </ul>
 
  <script type="text/javascript">
    const oFrag=document.createDocumentFragment();
    const ul = document.getElementsByTagName('ul')[0]
    oFrag.appendChild(ul);
  </script>

</body>
</html>
```
![enter image description here](https://i.ibb.co/MV2JZGG/20190505150437.jpg)
### createFragment vs innerHTML
对于dom的插入，createFragment和innerHTML哪个方法更好呢？看下面的例子

```javascript
const nodeAppend = document.createElement('div');
const htmlAppend = document.createElement('div');
const oFrag = document.createDocumentFragment();
console.time('nodeAppend10 time');
for(let i = 0; i < 10; i++) {
    const divTemp = document.createElement('div');
    let nodes = null;
    divTemp.innerHTML = 'htmlAppend';
    nodes = divTemp.childNodes;
    for (let i = 0, length = nodes.length; i < length; i++) {
        oFrag.appendChild(nodes[i].cloneNode(true));
    }
}
nodeAppend.appendChild(oFrag);
console.timeEnd('nodeAppend10 time');

console.time('htmlAppend10 time');
for(let i = 0; i < 10; i++) {
    htmlAppend.innerHTML += 'htmlappend';
}
console.timeEnd('htmlAppend10 time');

console.log('==================分割线================');
console.time('nodeAppend10000 time');
for(let i = 0; i < 10000; i++) {
    const divTemp = document.createElement('div');
    let nodes = null;
    divTemp.innerHTML = 'htmlAppend';
    nodes = divTemp.childNodes;
    for (let i = 0, length = nodes.length; i < length; i++) {
        oFrag.appendChild(nodes[i].cloneNode(true));
    }
}
nodeAppend.appendChild(oFrag);
console.timeEnd('nodeAppend10000 time');

console.time('htmlAppend10000 time');
for(let i = 0; i < 10000; i++) {
    htmlAppend.innerHTML += 'htmlappend';
}
console.timeEnd('htmlAppend10000 time');
```
![enter image description here](https://i.ibb.co/6wtwGxB/20190505152624.jpg)
测试结果如图：在10次循环的时候innerHTML更快，但是在10000次循环的时候，速度远不如createFragment，出现这样的结果原因主要是因为：

在js中string类型是不可变的，每次赋值的时候，都需要先销毁原来的字符串，然后再将新的字符串填充该变量，字符串越多，改动的成本就越大

然而createFragment所做的操作花费时间都是比较平均的，不过相对于简单的字符串，createFragment耗时要久一点
