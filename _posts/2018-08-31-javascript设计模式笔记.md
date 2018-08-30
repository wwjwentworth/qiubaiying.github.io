---
layout:     post
date:       2018-08-31
author:     WWJ
header-img: img/post-bg-universe.jpg
catalog: true
tags: 设计模式
---

# javasctipt设计模式
### 单例模式
> 保证一个类只有一个实例，实现的方法是使用闭包，先判断实例存在与否，如果存在则直接返回，如果不存在就创建了再返回，这就确保了一个类只有一个实例对象。
**透明的单例模式**
```javascript
const CreateDiv = (function() {
	let instance;
	let CreateDiv = function(html) {
		if (instance) return instance
		this.html = html;
		this.init();
		reutrn instance = this;
	}
	CreateDiv.prototype.init = function() {
		let div = document.createElement('div');
		div.innerHTML = this.html;
		document.body.appendChild(div);
	}
	return CreateDiv;
})();
let a = new CreateDiv('aaa');
let b = new CreateDiv('bbb');
console.log(a === b); // true
```

CreateDiv实际上做了2件事，第一件事是保证只有一个对象，第二件事是执行初始化init函数，这是一种很不好的做法，我们应该将这两件事情分开来处理

**代理单例模式**
```javascript
// 创建对象
var CreateDiv = function(html) {
	this.html = html;
	this.init();
}
CreateDiv.prototype.init = function() {
	let div = document.createElement('div');
	div.html = this.html;
	document.body.appendChild(div);
}

// 保证只有一个对象
var ProxyGetSingleton = (function() {
	let instance;
	return function(html) {
		if (instance) return instance;
		return instance = new CreateDiv(html);
	}
})()

```
**通用的惰性单例**
```javascript
let Singleton = function(fn) {
   let instance;
   return function() {
        return instance || (instance = fn.apply(this, arguments));
    }
}
let CreateLoginLayer = Singleton(function() {
    let div = document.createElement('div');
    div.innerHTML = '我是登录窗';
    div.className = 'login';
    div.style.display = 'none';
    document.body.appendChild(div);
    return div;
})
document.getElementById('btn').onclick = function() {
    let loginlayer = CreateLoginLayer();
    loginlayer.style.display = 'block';
}
document.getElementById('hidden').onclick = function() {
    let loginlayer = CreateLoginLayer();
    loginlayer.style.display = 'none';
}


```



### 策略模式
> 将算法的实现与使用分离开来

**代理模式由两部分组成，一部分是一组策略类，策略封装了具体的算法和实现过程；一部分是算法的使用。算法使用的部分接收客户的请求，然后将请求代理给某一个策略类**

**传统的面向对象的策略模式**
```javascript
// 策略类
let performanceS = function () { };
performanceS.prototype.calculate = function (salary) {
    return salary * 4;
}

let performanceA = function () { };
performanceA.prototype.calculate = function (salary) {
    return salary * 3;
}

let performanceB = function () { };
performanceB.prototype.calculate = function (salary) {
    return salary * 2;
}


// 奖金类
let Bonus = function () {
    this.salary = null;
    this.strategy = null;
}
Bonus.prototype.setSalary = function (salary) {
    this.salary = salary;
}
Bonus.prototype.setStrategy = function (strategy) {
    this.strategy = strategy;
}
Bonus.prototype.getBonus = function() {
    return this.strategy.calculate(this.salary)
}
let bonus = new Bonus();
bonus.setSalary(10000);
bonus.setStrategy(new performanceS());

console.log(bonus.getBonus()) // 40000
```

在javascript语言中，函数也是对象，将各个策略封装在一个对象中
```javascript
// 策略类，封装了算法的具体实现
const StrategyMode = {
    'A': function(money) {
        return money * 2;
    },
    'B': function(money) {
        return money * 3;
    },
    'S': function(money) {
        return money * 4;
    }
}

// 接收客户的请求，[level, money]
const calculate = function(level, money) {
    return StrategyMode[level](money);
}
console.log(calculate('A', 1005));
```

**策略模式的优缺点**
* 策略模式利用组合、委托和多态的思想，可以有效地避免多重条件选择语句
* 完美支持开放-封闭原则，将算法封装在独立的strategy中，使得它门易于切换、理解和扩展


### 代理模式
* 当用户向主体对象发起请求的时候，将该请求给代理对象处理
* 主体请求和代理请求需要有相同的接口实现

**代理模式实现图片预加载（虚拟代理）**
> 虚拟代理把一些开销很大的对象，延迟到真正需要它的时候才去创建
```javascript
let myImage = (function () {
   let imgNode = document.createElement('img');
    document.body.appendChild(imgNode)
    return {
        setSrc: function (src) {
            imgNode.src = src;
        }
    }
})();
        
let proxySetImg = (function () {
    let img = new Image;
    img.onload = function () {
        myImage.setSrc(this.src);
    }
    return {
        setSrc: function (src) {
            myImage.setSrc('./1.jpg');
            img.src = src;
        }
    }
})();

proxySetImg.setSrc('http://img02.tooopen.com/images/20160509/tooopen_sy_161967094653.jpg')
```

**缓存代理**
> 缓存代理可以为一些开销很大的运算结果提供暂时的存储，在下次运算时，如果传递进来的参数跟之前的一样，则可以直接返回之前存储的结果

```javascript
// 计算乘积
let multi = function() {
   let sum = 1;
   for (let i = 0; i < arguments.length; i++) {
       sum *= arguments[i];
   }
   return sum;
}
let proxyMulti = (function() {
   let cache = {};
   return function() {
       let _args = Array.prototype.join.call(arguments, ',');
       if (_args in cache) {
           return cache[_args];
       }
       return cache[_args] = multi.apply(this, arguments);
   }
})();
console.log(proxyMulti(2,3,4,5)); // 120
```

**利用高阶函数动态创建代理**
```javascript
let multi = function() {
    let sum = 1;
    for (let i = 0; i < arguments.length; i++) {
        sum *= arguments[i];
    }
    return sum;
}
let add = function() {
    let sum = 0;
    for (let i = 0; i < arguments.length; i++) {
        sum += arguments[i];
    }
    return sum;
}
let createProxy = function(fn) {
    let cache = {};
    return function() {
        let _args = Array.prototype.join.call(arguments, ',');
        if (_args in cache) {
            return cache[_args];
        }
        return cache[_args] = fn.apply(this, arguments);
    }
};
let proxyMulti = createProxy(multi);
let proxyAdd = createProxy(add);
console.log(proxyMulti(2,3,4,5)) // 120
console.log(proxyAdd(2,3,4,5)) // 14
```

### 迭代器模式
> 只要对象有length属性，都能被迭代

**内部迭代器**：调用者不必关心迭代器内部的实现细节，只需要调用迭代器提供的接口就行了

```javascript
let each = function(arr, callback) {
	for (let i = 0; i < arr.length; i++) {
		callback(arr[i], i, arr[i]);
	}
}
each([1,2,3,4], function(val, idx) {
	console.log(val, idx);
})
```

**外部迭代器**：调用者可以在外面自定义实现规则
```javascript
let Iterator = function (obj) {
    let curCount = 0;
    let next = function () {
        curCount++;
    }
    let isDone = function () {
        return curCount >= obj.length
    }
    let getCurItem = function () {
        return obj[curCount];
    }
    return {
        next: next,
        isDone: isDone,
        getCurItem: getCurItem,
        length: obj.length
    }
}

// 自定义实现细节
let compare = function (iterator1, iterator2) {
    if (iterator1.length !== iterator2.length) return;
    while (!iterator1.isDone() && !iterator2.isDone()) {
        if (iterator1.getCurItem() !== iterator2.getCurItem()) return false;
        iterator1.next();
        iterator2.next();
    }
    return true;
}

let iterator1 = Iterator([1, 2, 3, 4]);
let iterator2 = Iterator([1, 2, 3, 4]);
console.log(compare(iterator1, iterator2)); // true
```

### 发布-订阅模式
```javascript
(function() {
   const ArrayProto = Array.prototype,
   _shift = ArrayProto.shift;
        // 新建一个发布者对象，该对象有三个动作，发布、订阅和取消订阅，并且用一个缓存列表来存储每一种类型的消息
    const WwjEvent = function() {
        let cacheList = {};
        // 订阅
        const listen = function(key, fn) {
            // 如果此类型的消息还没有被订阅，那么就为此类型的消息
            // 开辟一个空间用来缓存此类型的消息
            if (!cacheList[key]) {
                cacheList[key] = [];
            }
            // 如果已经被订阅了，那么就直接存入改类型对应的缓存列表中
            cacheList[key].push(fn);
        };
        // 发布
        const trigger = function() {
            // 获取发布的消息类型
            const key = _shift.call(arguments);
            const fnList = cacheList[key];
            // 如果消息列表为空的话，那么就说明此类型的消息还没有被订阅，
            // 直接返回
            if (!fnList || !fnList.length) return;
            
            // 遍历消息列表，并执行
            fnList.forEach(fn => {
                fn.apply(this, arguments); // 此处的arguments是发布时附送的消息
            })
        };
        const remove = function(key, fn) {
            if (!key) return;
            let fnList = cacheList[key];
            // 如果key存在但是fn不存在的话，那么说明消息类型为key的消息全部要被取消
            if (key && !fn) {
                fnList.length = 0;
            }
            for (let i = 0, l = fnList.length; i < l; i++) {
                if (fnList[i] === fn) {
                    fnList.splice(i, 1);
                }
            }
        }
        return {
            listen,
            trigger,
            remove
        }
    };
    const event = new WwjEvent();
    event.listen('squareMeter88', function(price) {
        console.log(price);
    });

    event.listen('squareMeter110', function(price) {
        console.log(price);
    });

    event.trigger('squareMeter88', 20000);
    event.trigger('squareMeter110', 30000);
    event.remove('squareMeter88');
    
})();
```

### 命令模式
> 命令模式：将命令的发起者和命令的接收者隔离开，运用的场景：有时我们需要向某个对象发送请求，但不知道请求的接受者是谁，也不考虑接受者处理请求的方式。看起来是不是就是回调函数的用法，实际情况也是这样的，即命令模式就是一个回调函数面向对象的替代品

```javascript
(function() {
    const btn = document.getElementById('btn');
    const input = document.getElementById('input');
    // 命令发起者向命令对象发起命令
    const setCommand = function(btn, command) {
        // 点击按钮后的事情由命令对象的接受者执行
        btn.onclick = function() {
            command.excute();
        }
    }

    // 命令的接收者
    const MenuBar = {
        refresh: function() {
            input.value = '我已经接到更新命令啦！！！'
        }
    }

    // 命令对象, 接受一个命令的接受者, 返回命令的执行动作
    const MenuBarCommand = function(receiver) {
        return {
            excute: function() {
                receiver.refresh();
            }
        }
    }

    const menubarCommand = MenuBarCommand(MenuBar);
    setCommand(btn, menubarCommand);
})();
```
**宏命令**
> 先将需要执行的命令放入命令队列中，然后再一次执行

```javascript
(function() {
    const btn = document.getElementById('btn');
    const closeDoor = document.getElementById('closeDoor');
    const openDoor = document.getElementById('openDoor');
    const openTV = document.getElementById('openTV');
    // 命令发起者向命令对象发起命令
    const setCommand = function(btn, command) {
        // 点击按钮后的事情由命令对象的接受者执行
        btn.onclick = function() {
            command.excute();
        }
    }

    // 一系列命令
    const CloseDoorCommand = {
        excute: function() {
            closeDoor.innerHTML = '关门';
        }
    }
    const OpenDoorCommand = {
        excute: function() {
            openDoor.innerHTML = '开门';
        }
    }
    const OpenTVCommand = {
        excute: function() {
            openTV.innerHTML = '开电视';
        }
    }
    
    const MacroCommand = function() {
        return {
            commandList: [],
            add: function(command) {
                this.commandList.push(command);
            },
            excute: function() {
                this.commandList.forEach(command => {
                    command.excute();
                })
            }
        }
    }
    
    const macroCommand = MacroCommand();
    macroCommand.add(CloseDoorCommand);
    macroCommand.add(OpenDoorCommand);
    macroCommand.add(OpenTVCommand);
    setCommand(btn, macroCommand);
})();
```

### 组合模式
> 组合模式：个体与整体的一致性，即操作个体与操作整体的方法是一样的

 举个例子：假如一个网站中有一个及时验证表单，如果有一个field验证不成功的话，提交的按钮都是灰色的不可点击状态，我们可以写很多个&&来判断每个field是否通过验证
```
if (nameField.validData() && idCard.validData() && emial.validData() && phone.validData()) {
   // 通过验证，可以提交
}
```
但是这样写的弊端在于之后有新的字段需要验证的话，又得加上，难以维护
更好的实现是有一个`form.validata`函数, 它负责把真正的`validata`操作分发给每个组合对象.
`form.validata`函数里面会依次遍历所有需要校验的field. 若有一个field校验未通过, `form.validata`都会返回`false`. 伪代码如下.
```javascript
from.validData = function () {
    fields.forEach(field => {
        if (!field.validData()) return false;
    })
    return true;
}
```
在另外一篇博客里面看到了有关组合模式的分析，感觉就是命令模式的宏命令的实现
```javascript
function FlightOrder() { }
FlightOrder.prototyp.create = function () {
    console.log("flight order created");
}
function HotelOrder() { }
HotelOrder.prototype.create = function () {
    console.log("hotel order created");
}
function TotalOrders() {
    this.orderList = [];
}
TotalOrders.prototype.addOrder = function (order) {
    this.orderList.push(order);
}
TotalOrders.prototype.create = function (order) {
    for (var i = 0, length = this.orderList.length; i < length; i++) {
        this.orderList[i].create();
    }
}
var flight = new FlightOrder();
flight.create();

var orders = new TotalOrders();
orders.addOrder(new FlightOrder());
orders.addOrder(new HotelOrder());
orders.create();
```
### 模板方式模式
> 原理就是利用继承
> 该模式一共分成2部分，一部分是抽象的父类，一部分是具体实现的子类；父类封装了子类算法的具体实现

```javascript
const Interview = function() {}
Interview.prototype.writeTest = function() {} // 空方法，由子类重写
Interview.prototype.technically = function() {} // 空方法，由子类重写
Interview.prototype.HRView = function() {} // 空方法，由子类重写

Interview.prototype.init = function() {
    this.writeTest();
    this.technically();
    this.HRView();
}

const KjlInterview = function() {};
KjlInterview.prototype = new Interview(); // 继承父类
KjlInterview.prototype.writeTest = function() {
    console.log(`我通过酷家乐的笔试啦！！！`);
}
KjlInterview.prototype.technically = function() {
    console.log(`我通过酷家乐的技术面啦！！！`);
}
KjlInterview.prototype.HRView = function() {
    console.log(`我通过酷家乐的HR面啦！！！`);
}
const kjlInterview = new KjlInterview();
kjlInterview.init();
```

### 享元模式
>  享元模式：主要用来优化性能，避免生成大量相似的对象而造成内存的浪费
>  享元类：用来保存内在数据
> 享元工厂：用来维护享元类的内在数据
> 客户端：用来调用享元工厂来获取享元类的内在数据

 举个例子：假设苹果厂商现在需要生成1百万台苹果手机，所有手机的型号和屏幕都相同，不同的是手机的内存，有16G、32G
**一般实现**
```javascript
const Iphones = function(model, screen, memory) {
    this.model = model;
    this.screen = screen;
    this.memory = memory;
}
let iphoneList = [];
for (let i = 0; i < 1000000; i++) {
    let memory = i % 2 ? '16G' : '32G';
    iphoneList.push(new Iphones('iphone6s', 5.0, memory));
}
```
这样的结果就是我们创建了1百万个Iphone对象,为每一个iphone都申请了一个内存
抽离出公用数据，model，screen，momory，创建一个享元类，来保存这些公用数据（内在数据）

**享元模式实现**
```javascript
// 享元类
const Flyweight = function(model, screen, memory) {
    this.model = model;
    this.screen = screen;
    this.memory = memory;
}
// 创建一个享元工厂类来获取享元类的内在数据（有点像单例模式的意思）
const flyweightFactory = (function() {
    let phones = {};
    return {
        get: function(model, screen, memory) {
            let key = model + screen + memory;
            // 核心，如果改种手机已经被创建，那么就不需要再重复创建了
            if (!phones[key]) {
                return new Flyweight(model, screen, memory);
            }
            return phones[key];
        }
    }
})();
// 创建一个客户端类,用来调用享元工厂来获取享元类的内在数据
const Iphones = function(model, screen, memory) {
    this.flyweight = flyweightFactory.get(model, screen, memory);
}
let iphoneList = [];
for (let i = 0; i < 1000000; i++) {
    let memory = i % 2 ? '16G' : '32G';
    iphoneList.push(new Iphones('iphone6s', 5.0, memory));
}
```

### 职责链模式
> 职责链模式： 对象A向对象B发起请求，对象B不处理，那么就交给对象C，对象C不处理，那么就交给对象D，一只鸟到有对象处理这个请求为止

**举个例子：**现在有这样的一个需求：支付定金500块钱，可获得100元优惠卷，支付定金200快，可获得50元优惠卷，没有支付任何定金，进入普通购买模式，且库存不足的情况下不能购买

**一般实现**
```javascript
/**
* orderType: 订单类型
* pay: 用户是否已经支付了定金
* stock：库存
*/
const order = function (orderType, pay, stock) {
    if (orderType === 1) {
        if (pay) {
            console.log('支付定金500，可获得100元优惠卷');
        } else {
            if (stock > 0) {
                console.log('没有支付定金，进入普通购买模式');
            } else {
                console.log('手机库存不租')
            }
        }
    } else if (orderType === 2) {
        if (pay) {
            console.log('支付定金200，可获得50元优惠卷');
        } else {
            if (stock > 0) {
                console.log('没有支付定金，进入普通购买模式');
            } else {
                console.log('手机库存不租')
            }
        }
    } else if (orderType === 3) {
        if (stock > 0) {
            console.log('没有支付定金，进入普通购买模式');
        } else {
            console.log('手机库存不租')
        }
    }
}
order(1, true, 0);
order(2, false, 90);
order(2, false, 0);
order(2, true, 0);
```
写了太多if-else，代码极不优雅

**职责链模式实现**
```javascript
const order500 = function (pay, stock) {
   if (pay) {
        console.log('支付定金500，可获得100元优惠卷');
    } else {
        order200(pay, stock)
    }
}
const order200 = function (pay, stock) {
    if (pay) {
        console.log('支付定金200，可获得50元优惠卷');
    } else {
        order(stock);
    }
}
const order = function (stock) {
    if (stock > 0) {
        console.log('没有支付定金，进入普通购买模式');
    } else {
        console.log('手机库存不租')
    }
}
order500(true, 500);
order200(false, 500);
order200(false, 0);
```
职责链的传递耦合在了业务逻辑中
**代码优化：将业务逻辑和职责链的传递分离开来**
```javascript
// 业务逻辑
const order500 = function(orderType, pay, stock) {
    if (orderType === 1 &&  pay) {
        console.log('支付定金500，可获得100元优惠卷');
    } else {
        return 'nextSuccessor';
    }
}
const order200 = function(orderType, pay, stock) {
    if (orderType === 2 && pay) {
        console.log('支付定金200，可获得50元优惠卷');
    } else {
        return 'nextSuccessor';
    }
}
const order = function(orderType, pay, stock) {
    if (stock > 0) {
        console.log('没有支付定金，进入普通购买模式');
    } else {
        console.log('库存不足');
    }
}

// 职责链对象，负责请求的传递
const Chain = function(fn) {
    this.fn = fn;
    this.nextSuccessor = null;
}
// 设置职责链节点
Chain.prototype.setNextSuccessor = function(nextSuccessor) {
    this.nextSuccessor = nextSuccessor;
}
Chain.prototype.passRequest = function() {
    let ret = this.fn.apply(this, arguments);
    // 核心，传递请求
    if (ret === 'nextSuccessor') {
        this.nextSuccessor.passRequest.apply(this.nextSuccessor, arguments);
    }
}

const chainOrder500 = new Chain(order500);
const chainOrder200 = new Chain(order200);
const chainOrderNormal = new Chain(order);

chainOrder500.setNextSuccessor(chainOrder200);
chainOrder200.setNextSuccessor(chainOrderNormal);

chainOrder500.passRequest(1, true, 500);
chainOrder500.passRequest(2, false, 500);
chainOrder500.passRequest(2, true, 0);
```
