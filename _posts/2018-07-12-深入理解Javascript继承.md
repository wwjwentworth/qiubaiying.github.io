---
layout:     post
date:       2018-07-12
author:     WWJ
header-img: img/post-bg-universe.jpg
catalog: true
tags: javascript
---

# Javascript继承
**prototype，contrucotr，__proto__关系和区别**
* 每一个构造函数内部都有一个内置的属性`prototype`指向它的原型对象
* 每一个原型对象都有一个内置的属性`contructor`指向构造函数
* 每一个实例对象都有一个内置的属性`__proto__`指向构造该实例对象的构造函数的原型对象

`javascript`的继承核心就是通过`__proto__`来实现的
当查找一个实例的属性时，会先从这个实例对象内部区查找，如果没有找到，就会顺着`__proto__`指向的原型对象上去查找，顺着`__proto__`一级一级往上找，一直找到`Object`的原型对象上，因为在`javascript`中，`Object`是所有对象的“父类”，如果，还没有找到，就是`undefined`;

### 原型链继承
```javascript
function SuperClass(username, password) {
   this.username = username;
   this.password = password;
}
SuperClass.prototype.login = function() {
   console.log('您要登录的用户名和密码是：' + this.username + ', ' + this.password);
}

function SubClass(username, password) {
	//重点
   this.__proto__ = new SuperClass(username, password);
}

const sub = new SubClass('wwj', 'iopjkl1002');
console.log(sub.login());
```
**分析**
1. 执行`const sub = new SubClass('wwj', 'iopjkl1002');`后，`sub`是`SubClass`的一个实例，所以`sub.__proto__ === SubClass.prototype`；
2. 但是`SubClass`原型对象上并没有`login`函数，所以，我们就要强行将`sub.__proto__`指向`SuperClass`的原型对象，即在`SubClass`函数内部执行`this.__proto__ = new SuperClass(username, password);`
3. 但是这回造成一个问题，即导致` sub.__proto__ === SubClass.prototype `不成立！从而导致` sub instanceof SubClass` 也不成立，这不应该发生

所以我们不应该私自篡改`__proto__`

我么可以考虑把原型的赋值放在外面
```javascript
function SuperClass(username, password) {
    this.username = username;
    this.password = password;
}
SuperClass.prototype.login = function() {
    console.log('您要登录的用户名和密码是：' + this.username + ', ' + this.password);
}

function SubClass(username, password) {
    
}
SubClass.prototype = new SuperClass();// 无法传参
```
但是这又有两个问题
1. 父类过早的被创建，无法动态传参；
2. 父类上如果定义了引用类型的值的话，那么会被所有子类共享，意思就是，如果子类1改变了这个引用类型的值，会影响其它子类

**举例说明验证问题2**
```javascript
function SuperClass(username, password) {
    this.username = username;
    this.password = password;
    this.share = [1,2,3,4,5];
}

function SubClass(username, password) {
    
}
SubClass.prototype = new SuperClass()
const sub1 = new SubClass('wwj', 'iopjkl1002');
const sub2 = new SubClass('wwj2', 'iopjkl1002');
sub1.share.push(6)
console.log(sub1.share) //[1,2,3,4,5,6]
console.log(sub2.share); //[1,2,3,4,5,6]
```
操作的是`sub1`上的`share`变量，但是`sub2`也跟着变了
### 构造函数继承
通过`call`来实现继承，也可以用`apply`
```javascript
function SuperClass(username, password) {
  this.username = username;
    this.password = password;
}

SuperClass.prototype.login = function() {
    console.log('你要输入的用户名和密码是：' + this.username + ', ' + this.password);
}
function SubClass(username, password) {
    SuperClass.call(this, username, password)
}
const sub = new SubClass('wwj', 'iopjkl1002');

console.log(sub.login()) //Uncaught TypeError: sub.login is not a functionat <anonymous>:14:25
```
虽然解决了动态传参的问题，但是却没有继承原型对象上方法，所以这种方法没有实现根本意义上的继承
### 构造+原型组合继承
为了既能够动态传参，又能继承原型对象上的方法，所以就把这两种方法结合起来
构造函数继承实现继承私有属性，原型链继承实现继承公有方法

```javascript
function SuperClass(username, password) {
  this.username = username;
    this.password = password;
}

SuperClass.prototype.login = function() {
    console.log('你要输入的用户名和密码是：' + this.username + ', ' + this.password);
}
function SubClass(username, password) {
    SuperClass.call(this, username, password) //第二次执行父类构造函数
}

SubClass.prototype = new SuperClass() //第一次执行父类构造函数
const sub = new SubClass('wwj', 'iopjkl1002');
console.log(sub.login())
```
组合式虽然解决了构造函数无法继承原型对象上的方法的问题以及原型链继承会共享父类引用类型值的问题，但是如以上代码，父类的构造函数被执行了两次，所以这种方法也不是最好的方法，那么有没有更好的方法呢？
### 寄生组合继承
为了避免执行两次父类的构造函数，优化方法就是，不需要为了指定子类的原型对象而调用父类的构造函数，即`SubClass.prototype = new SuperClass()`这一步没有必要，因为在子类的构造函数中，调用父类构造函数的时候`SuperClass.call(this, username, password)`，就已经继承了父类的属性（不包括原型对象上的属性），所以我门的问题就是如何让子类继承父类原型对象上的方法？

我们是不是只需要父类原型对象的一个副本，然后让子类的原型指向这个副本就可以了
```javascript
function inherit(SubClass, SuperClass) {
	const prototype = Object.create(SuperClass.prototype)
	SubClass.prototype = prototype
	prototype.contructor = SubClass //执行这一步是因为我们改变了SubClass上的prototype性的指向，因为SubClass.prototype默认是指向Child的原型对象的，而SubClass的原型对象的contructor也是默认指向SubClass，现在改变了指向，即现在子类的原型指向了SuperClass了，但是现在子类的原型对象上的contructor却不是指向SubClass,而是SuperClass,所以要手动改过来，已保证原型链不会紊乱
}
```
以上核心代码总共分为3部分
* 创建一个父类原型对象的副本
* 将子类的原型属性指向这个副本
* 手动改动子类原型对象上的contructor的指向

**全部代码**
```javascript
function inherit(SubClass, SuperClass) {
    const prototype = Object.create(SuperClass.prototype)
    SubClass.prototype = prototype;
    prototype.contructor = SubClass;
}
function SuperClass(username, password) {
    this.username = username;
    this.password = password;
}

SuperClass.prototype.login = function() {
    console.log('你要输入的用户名和密码是：' + this.username + ', ' + this.password);
}
function SubClass(username, password) {
    SuperClass.call(this, username, password)
}
inherit(SubClass, SuperClass);
const sub = new SubClass('wwj', 'iopjkl1002');

console.log(sub.login())
```
寄生组合继承方法解决以上所有的缺点

* 子类继承了父类的属性和方法，同时，属性没有被创建在原型链上，因此多个子类不会共享同一个属性。
* 子类可以传递动态参数给父类！
* 父类的构造函数只执行了一次！
