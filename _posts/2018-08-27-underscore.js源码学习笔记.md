---
layout:     post
date:       2018-08-27
author:     WWJ
header-img: img/post-bg-universe.jpg
catalog: true
tags: javascript
---

# underscore源码学习

将内置对象上的一些方法事先用一个变量给保存起来，以免每次需要使用Array.prototype、Object.prototype、Function.prototype的时候都要重新去获取，节省了时间，我觉得这是一个比较好的习惯，学习了。
```javascript
var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;
```

### 支持无 new调用构造函数
就是支持在构造函数内部返回构造函数的实例
```javascript
// 面对对象编程的时候才会进入函数内部
// 像_([1,2,3,4]).each(alert)
// _([1,2,3,4]) 相当于无 new构造了一个对象
// 如果直接使用_.each(alert)的话，就不会执行这个函数了
var _ = function(obj) {
	if (obj instanceOf _) return obj;
	if (!(this instanceOf _)) return new _(obj);
}
```

### optimizeCb (func, context, argCount)和 cb(func, context, argCount)的运用场景
optimizeCb函数适用于func的类型只是Function，像each、forEach的回调函数，而cb函数则适用于func的类型不只是Function，像map函数，可能还是对象，或者是基本类型的值，当func的类型是Function的时候，那就跟optimizeCb一样，返回func；当func的类型是对象的时候，返回map的每一项是否符合func的布尔值；当func的类型是基本类型的值的时候，就返回map的每一项的值

```javascript
// optimizeCb (func, context, argCount)
// argCount这个参数的作用就是为了调用call函数，如果不用这个参数，直接调用apply也是一样的，但就是因为call比apply快很多
optimizeCb = function(func, context, argCount) {
	// 使用call

	// 如果argCount没有传入的话，就默认为3
	let argCount === argCount === void 0 ? 3 : argCount;
	switch (argCount) {
		case 1: return function(value) {
			return func.call(context, value);
		}
		case 2: return function(value, others) {
			return func.call(context, value, others);
		}
		case 3: return function(value, index, collection) {
			return func.call(context, value, index, collection);
		}
		
		// 适用于reduce函数
		case 4: return function(accumulator, value, index, collection) {
			return func.call(context, accumulator, value, index, collection);
		}
	}

	// 使用apply,因为不需要考虑argCount的个数，那么就不需要switch-case条件语句了，直接
	return function () {
		return func.apply(context, arguments);
	}
}


// cb (func, context, argCount)
cb = function(func, context, argCount) {
	// 当func的类型是Function的时候，那就跟optimizeCb一样，返回func；这里可以直接调用optimizeCb函数了
	if (_.isFunction(func)) return optimizeCb(func, context, argCount);
	// 当func的类型是对象的时候，返回map的每一项是否符合func的布尔值；
	if (_.isObject(func)) return _.matcher(func);
	// 当func的类型是基本类型的值的时候，就返回map的每一项的值;
	return _.property(func);
}
```

### 合并对象（createAssigner）
这个函数主要的作用是提供一个闭包函数
```javascript
createAssigner = function(keyFunc, undefinedOnly) {
	return function(obj) {
		let length = arguments.length;
		if (length < 2 || !obj) return obj
		for (let i = 1; i < length; i++) {
			let source = arguments[i];
				keys = keyFunc(source);
				len = keys.length;
			for (let j = 0; j < len; j++) {
				let key = keys[j];
				if (!undefinedOnly || obj[key] === void 0) {
					obj[key] = source[key];
				}
			}
		}
		return obj;
	}
}

// 会将obj的所有属性（包括继承的）一起复制，_.allKeys函数会返货对象的所有key，（包括原型上的），后面的覆盖前面的属性值
_.extend = createAssigner(_.allKeys, obj)
// 会将obj的所有属性（不包括包括继承的）一起复制，_.allKeys函数会返货对象的所有key，（不包括原型上的），后面的会覆盖前面的属性值
_.extendOwn = createAssigner(_.keys, obj);
// 会将obj的所有属性（包括继承的）一起复制，_.allKeys函数会返货对象的所有key，（包括原型上的），不会覆盖
_.defaults = createAssogner(_allkeys, true, obj);
```

