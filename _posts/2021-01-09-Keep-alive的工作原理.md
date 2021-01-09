
# keep-alive工作原理

### keep-alive的特性
----------
keep-alive是Vue提供的一个抽象组件（内置），它自身不会渲染成一个DOM元素，也不会出现在父组件链中，使用keep-alive包裹动态组件时，会缓存不活动的组件实例，而不是销毁它们；

我们先来看一个例子，来更加直观的了解keep-alive的特性

```vbscript-html
<body>
  <div id="app">
    <button @click="handleChangeChild('child1')">child 1</button>
    <button @click="handleChangeChild('child2')">child 2</button>
    <keep-alive>
      <component :is="currentChild"></component>
    </keep-alive>
  </div>
</body>
```

```javascript
const child1 = {
  template: `<div><button @click="handleAddNum">add</button><p>{{num}}</p></div>`,
  data() {
    return {
      num: 0
    }
  },
  methods: {
    handleAddNum() {
      this.num++;
    }
  }
}


const child2 = {
  template: `<div>child2</div>`
}

new Vue({
    el: "#app",
    components: {
      child1,
      child2
    },
    data() {
       return {
         currentChild: 'child1'
       }
    },
    methods: {
      handleChangeChild(child) {
        this.currentChild = child
      }
    }
});
```

运行效果如下
![Alt text](https://image.xiaomaiketang.com/xm/mPB8bkG4b6.gif)

我们可以看到，当前组件为child1的时候，我们将child1组件的num累加至9，然后切换到child2组件，再切换到child1组件，child1组件仍然保留着原来的数据状态，即num = 9；

#### 抽象组件
文章一开始我们就说到，keep-alive是一个内置的抽象组件；Vue提供的内置组件都有一个用来描述组件类型的选项，用来描述抽象组件的选项就是`{abstract: true}`；什么是抽象组件，以及为什么有这一类型的区别呢？以下有两点可以解释这两个为什么；

1. 抽象组件不渲染真实的DOM，而是作为一个中间过渡层，用来给子组件做缓存处理
2. 在实例挂载之前，会先进行一系列的初始化工作，其中有一项就是建立父子组件的关联关系，这层关系奠定了父子组件通信的基础。

这层关系是在`initLifeCycle`函数里面去实现的，我们来看下`initLifeCycle`里面的代码；

```javascript
Vue.prototype._init = function() {
	// ...
	initLifeCycle(vm);
}
```

```javascript
function initLifeCycle(vm: Component) {
	const options = vm.$options
	let parent = options.parent
	if (parent && !options.abstract) {
    while (parent.$options.abstract && parent.$parent) {
	    parent = parent.$parent
    }
    parent.$children.push(vm)
  }
  vm.$parent = parent
  // ...
  vm.$children = []
}
```

在`initLifeCycle`阶段，会从自身开始，向上查找父组件，在查找的过程中，如果父组件有`abstract`属性，说明该父组件是抽象组件，那么会继续向上查找，直到找到第一个不是抽象组件的父组件； 找到之后，将自身添加进父组件的`$children`属性中，最后将第一个非抽象父组件挂载到自身选项的`$parent`上；有了这一层上下级的关系，就能让每个组件都能很方便的找到上面的父组件和下面的子组件，使得组件之前形成一个很紧密的关系树；

再者，从上面代码可以看出，抽象组件不会出现在父子级路径上；

#### 缓存策略
keep-alive之所以能做到组件切换之后依然能够保持状态不变，其中原理就是利用了缓存策略；缓存策略有很多中，其中keep-alive使用的就是LRU（最近最少用）缓存策略；

**LRU缓存**
LRU（最近最少使用）根据数据的历史访问记录来进行淘汰。LRU设计的原则就是，如果一个数据在最近一段时间内都没有被访问到，那么它将来被访问的可能性也很小，当缓存空间不够的时候，优先删除最近一段时间内都没有被访问的数据；

下面这张图显示了LRU的缓存策略
![Alt text](https://image.xiaomaiketang.com/xm/m7jmST2bjT.png)

* 现在缓存最大只允许存储3个组件，ABC三个组件依次进入缓存，没有任何问题；
* 当D组件被访问时，但是这个时候缓存已经满了，所以只能将最近没有被使用到的A组件从缓存中删除，这个时候缓存中的组件分别是BCD；
* 当B组件再次被访问时，由于B组件还在缓存中，这个时候只需要将B组件移动到最新的位置，其他组件的位置往后娜一位；
* 当E组件被访问时，由于E组件并没有在缓存中，所以需要新的缓存空间在存储E组件，那么这个时候最近没有被使用的C组件就会从缓存中删除，E组件加入到最新的位置；

keep-alive利用LRU缓存策略做的事情就是，每当一个组件被访问的时候，就将该组件加入到缓存的最新位置，如果内存空间不足，则删除位置最靠后的那个组件；

### 初次渲染
----------
keep-alive作为一个内置组件，在编译流程上，它与用户自定义组件有什么区别吗？答案是没有的；不管是内置组件还是用户自定义组件，本质上组件在模板编译成render函数的处理方式是一样的；

有了render函数，接下来就会通过render函数来生成vnode，其中，如果节点是组件的话，会调用createComponent来生成组件vnode，在createComponent这个环节中，keep-alive和普通的组件还是有区别的；如果是keep-alive组件，会剔除掉除了slot其他所有属性，因为其他属性对于keep-alive来说是没有任何意义的，比如`class`属性，所以剔除掉多余的属性是很有必要的，可以避免很多不必要的处理；

```javascript
export function createComponent() {
	if (isTrue(Ctor.options.abstract)) {
	    const slot = data.slot
	    data = {}
	    if (slot) {
		     data.slot = slot
	    }
	}
}
```

上文说到，keep-alive的特性就是不会重复渲染同一个组件，组件初次渲染之后，会将渲染结果进行缓存，之后再使用该组件的时候，直接使用缓存结果就行了；

那么我们先来通过以下流程图来分析一下keep-alive的初次渲染流程

#### 流程图
![Alt text](https://image.xiaomaiketang.com/xm/GWstP2yk2i.png)
#### 源码解析

和普通组件的渲染流程一样，会拿到前面生成的vnode对象执行真实节点的创建过程，也就是patch过程；在patch流程中，会执行`createEle`方法，用来创建真实的DOM，当遇到`vnode`是组件节点时，这个时候便会执行`createComponent`方法，用来进行组件的初始化和实例化;

```javascript
function createComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
    let i = vnode.data
    if (isDef(i)) {
      // vnode.componentInstance 组件是否已经被实例化了
      // i.keepAlive = vnode.data.keepAlive 组件是否被缓存了
      const isReactivated = isDef(vnode.componentInstance) && i.keepAlive
      // 如果vnode.data.hook和vnode.data.init都存在，执行组件的初始化操作
      if (isDef(i = i.hook) && isDef(i = i.init)) {
        // 执行组件初始化的内部钩子init
        i(vnode, false /* hydrating */)
      }
      // 调用init钩子之后，如果vnode是子组件，应该创建一个子组件并挂载它.
      // 子组件也设置了一个占位符vnode的ele，这种情况下我们只需要返回这个占位符就完事了

      // 如果组件已经实例化了
      if (isDef(vnode.componentInstance)) {
        // 其中一个作用是将真实的dom保留到vnode中
        initComponent(vnode, insertedVnodeQueue)
        insert(parentElm, vnode.elm, refElm)
        if (isTrue(isReactivated)) {
          reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm)
        }
        return true
      }
    }
  }
```

`keep-alive`组件内部会调用内部的钩子函数`init`，那么来看一下`init`钩子函数内部发生了什么事情；

```javascript
// 组件内部自带的钩子
const componentVNodeHooks = {
  init (vnode: VNodeWithData, hydrating: boolean): ?boolean {
    // 第一次执行很明显没有componentInstance属性，vnode.data.keepAlive也为false，所以第一次执行init的时候会先走else分支，调用createComponentInstanceForVnode函数进行组件实例化，并将结果赋值给vnode.componentInstance，最终执行组件实例的$mount方法
    if (
      vnode.componentInstance &&
      !vnode.componentInstance._isDestroyed &&
      vnode.data.keepAlive
    ) {
      const mountedNode: any = vnode // work around flow
      componentVNodeHooks.prepatch(mountedNode, mountedNode)
    } else {
      const child = vnode.componentInstance = createComponentInstanceForVnode(
        vnode,
        activeInstance
      )
      child.$mount(hydrating ? vnode.elm : undefined, hydrating)
    }
  },
  // prepatch
  // insert
  // destroy
}
```

初始化渲染的时候，很明显没有componentInstance属性，vm.data.keepAlive也为false，所以会走else分支，也就是会执行`createComponentInstanceForVnode`函数，那么我们再来看下`createComponentInstanceForVnode`内部发生了什么事情

```javascript
export function createComponentInstanceForVnode (
  vnode: any,
  parent: any,
): Component {
  const options: InternalComponentOptions = {
    _isComponent: true,
    _parentVnode: vnode,
    parent
  }
  
  return new vnode.componentOptions.Ctor(options)
}
```

从源码可以看出，`createComponentInstanceForVnode`其实就是返回了一个`vnode`，并将这个返回的`vnode`赋值给了`vnode.componentInstance`和`child`，最终执行了`child`的`$mount`方法进行实例的挂载；


#### 内置选项属性

执行了实例的挂载之后，接下来就会进入`render`阶段，在分析`render`之前，需要知道的是，一个普通组件的`render`函数要么是用户自定义的，要么是通过解析`template`生成的；那么`keep-alive`作为一个内置组件，它的render函数是否也是通过这两种方式而来的呢？答案是不是的；

其实内置这两个字就说明了`keep-alive`是在`Vue`内部内置好的选项配置，并且也已经注册到了全局，我们来看一下源码；

```javascript
// keep-alive的本质是寸缓存和拿缓存的过程，并没有实际的节点渲染
export default {
  name: 'keep-alive',
  abstract: true, // 标记该组件是一个抽象组件

  props: {
    include: patternTypes,
    exclude: patternTypes,
    max: [String, Number]
  },

  created () {
    // 缓存组件vnode
    this.cache = Object.create(null)
    // 缓存组件名
    this.keys = []
  },

  destroyed () {
    for (const key in this.cache) {
      pruneCacheEntry(this.cache, key, this.keys)
    }
  },

  mounted () {
    this.$watch('include', val => {
      pruneCache(this, name => matches(val, name))
    })
    this.$watch('exclude', val => {
      pruneCache(this, name => !matches(val, name))
    })
  },

  render () {
    // 拿到keep-alive下插槽的值
    const slot = this.$slots.default
    // 拿到keep-alive下第一个vnode节点
    const vnode: VNode = getFirstComponentChild(slot)
    // 拿到第一个组件实例
    const componentOptions: ?VNodeComponentOptions = vnode && vnode.componentOptions
    
    // 判断第一个组件实例是否存在
    if (componentOptions) {
      // 获取组件名称
      const name: ?string = getComponentName(componentOptions)
      const { include, exclude } = this
      // 如果子组件不满足匹配缓存的条件，那么会直接返回组件的vnode，不会做任何处理
      // include规定了只有名称匹配的组件才能被缓存
      // exclude规定了任何匹配的都不会被缓存
      if (
        (include && (!name || !matches(include, name))) ||
        (exclude && name && matches(exclude, name))
      ) {
        return vnode
      }

      const { cache, keys } = this
      // 如果子组件的key不存在的，生成一个key，存在就用用户定义的key
      const key: ?string = vnode.key == null
        ? componentOptions.Ctor.cid + (componentOptions.tag ? `::${componentOptions.tag}` : '')
        : vnode.key
      // 如果命中缓存
      if (cache[key]) {
        // 将组件缓存的componentInstance赋值给vnode.componentInstance
        vnode.componentInstance = cache[key].componentInstance
        // 先将命中缓存的key从缓存列表中移除，再将keypush到缓存列表中，这么做的原因是为了是当前的key最新
        remove(keys, key)
        keys.push(key)
      } else {
        // 如果没有命中缓存，那么将vnode赋值给cache[key]
        cache[key] = vnode
        keys.push(key)
        if (this.max && keys.length > parseInt(this.max)) {
          pruneCacheEntry(cache, keys[0], keys, this._vnode)
        }
      }
      // 为缓存组件打上标志
      vnode.data.keepAlive = true
    }
    return vnode || (slot && slot[0])
  }
}
```

`keep-alive`的选项本质上和我们写的组件的选项本质上没啥区别，唯一不同的是`keep-alive`没有使用`template`而是直接使用了`render`函数，之所以这么做，原因是`keep-alive`本质上是存缓存和拿缓存的过程，不进行真实节点的渲染；


在render函数体里面，首先会使用`getFirstComponentChild`获取第一个组件实例，也就是`keep-alive`下的插槽内容；

```javascript
export function getFirstComponentChild (children: ?Array<VNode>): ?VNode {
  if (Array.isArray(children)) {
    for (let i = 0; i < children.length; i++) {
      const c = children[i]
      // 如果组件存在，则返回，理论上是返回第一个组件的vnode
      if (isDef(c) && (isDef(c.componentOptions) || isAsyncPlaceholder(c))) {
        return c
      }
    }
  }
}
```

#### 缓存vnode
接着会判断该组件是否满足被缓存的条件，如果子组件不满足匹配缓存的条件，那么会直接返回组件的vnode，不会做任何处理；
Vue会使用include和exclude来匹配缓存，include规定了只有名称匹配的组件才能被缓存，exclude规定了任何匹配的都不会被缓存；

```javascript
if (
    // not included
    (include && (!name || !matches(include, name))) ||
    // excluded
    (exclude && name && matches(exclude, name))
  ) {
    return vnode
}
```

初次渲染的时候组件肯定是没有在缓存里面的，如果没有命中缓存，那么将vnode赋值给cache[key]，如果命中缓存了，则更新组件在缓存中的位置，使得命中缓存的组件的位置是最新的；

```javascript
if (cache[key]) {
    // 将组件缓存的componentInstance赋值给vnode.componentInstance
    vnode.componentInstance = cache[key].componentInstance
    // 先将命中缓存的key从缓存列表中移除，再将keypush到缓存列表中，这么做的原因是为了是当前的key最新
    remove(keys, key)
    keys.push(key)
  } else {
    // 如果没有命中缓存，那么将vnode赋值给cache[key]
    cache[key] = vnode
    keys.push(key)
    if (this.max && keys.length > parseInt(this.max)) {
      pruneCacheEntry(cache, keys[0], keys, this._vnode)
    }
}
```
在将新组件放入缓存之后，如果内存超过了最大限制，那么缓存中第一个位置的组件将会被删除，这就是我们文章一开始说到的LRU（最近最少用）缓存策略；

最后为组件打上缓存标志`vnode.data.keepAlive = true`，以便二次渲染的时候使用；

#### 保留真实的DOM至VNode中

回想一下我们一开始的流程图，组件初始化、实例化之后，会执行$mount操作来进行实例的挂载，紧接着会进入render阶段，生成需要的vnode，最后一步则是将真实的DOM保存至vnode；
我们在回到`createComponent`函数中，看一下这部分的逻辑；

```javascript
// 如果组件已经实例化了
if (isDef(vnode.componentInstance)) {
 // 其中一个作用是将真实的dom保留到vnode中
 initComponent(vnode, insertedVnodeQueue)
}
```

```javascript
function initComponent (vnode, insertedVnodeQueue) {
	// ...
    // 保留真实的dom到vnode中
    vnode.elm = vnode.componentInstance.$el
	// ...
}
```

至此，`keep-alive`的初次渲染就已经分析完了，总结一下其实就是将`vonode`和真实的`DOM`做了一个缓存处理；


### 二次渲染
----------
跟初次渲染一样，在分析二次渲染之前，我们也先来通过流程图了解一下整体的一个流程；
![Alt text](https://i.ibb.co/PwB2v9V/Snip20201226-6.png)

二次渲染从数据更新开始，数据更新之后，该数据在初始化阶段收集到的依赖将会进行派发更新操作；这个时候先会执行父组件的`update`，`update`阶段做的事情就是将虚拟DOM转化为真实的DOM，这其中就需要进行新旧节点的`patch`，而`patch`的核心步骤就是进行`patchVnode`，在`patchVnode`流程中，我们重点关注一下`prepatch`流程

```javascript
function patchVnode(
	oldVnode,
	vnode,
	insertedVnodeQueue,
	ownerArray,
	index,
	removeOnly
) {
	// ...
	if (isDef(data) && isDef(i = data.hook) && isDef(i = i.prepatch)) {
      i(oldVnode, vnode)
    }
}
```

```javascript
const componentVNodeHooks {
	init: () { }, // init初次渲染的时候已经分析过了
	prepatch: (oldVnode, vnode) {
		const options = vnode.componentOptions
	    const child = vnode.componentInstance = oldVnode.componentInstance
	    updateChildComponent(
	      child,
	      options.propsData, // updated props
	      options.listeners, // updated listeners
	      vnode, // new parent vnode
	      options.children // new children
	    )
	}
}
```

在`prepatch`函数里面，其实就是调用了`updateChildComponent`来更新子组件，其中还包括其他需要更新的数据，比如`propsData`、`listeners`、`children`。在`updateChildComponent`中，最核心的流程就是调用了实例的`$forceUpdate`来强制更新

```javascript
export function updateChildComponent (
	vm,
    propsData,
    listeners,
    parentVnode,
    renderChildren
) {
	// 如果有子组件的话先获取插槽内容，再强制更新
    if (needsForceUpdate) {
	    vm.$slots = resolveSlots(renderChildren, parentVnode.context)
	    vm.$forceUpdate()
   }	
}
```
在`updateChildComponent`阶段，执行了`vm.$forceUpdate()`之后，将会触发子组件的重新渲染，那么这个时候子组件将会再次执行`render`函数，不过由于第一次渲染的时候已经将组件的`vnode`存入了缓存中，第二次渲染的时候将直接从缓存中获取所需要的`vnode`；获取`vnode`之后，又来到了子组件的`patch`阶段，组件再次经历`createComponent`的过程，调用`init`；


```javascript
function createComponent(vnode, insertedVnodeQueue, parentElm, refElm) {
	const isReactivated = isDef(vnode.componentInstance) && i.keepAlive;
	// 第二次渲染的时候isReactivated为true
	// 如果vnode.data.hook和vnode.data.init都存在，执行组件的初始化操作
    if (isDef(i = i.hook) && isDef(i = i.init)) {
      // 执行组件初始化的内部钩子init
      i(vnode, false /* hydrating */)
    }
	if (isDef(vnode.componentInstance)) {
        // 其中一个作用是将真实的dom保留到vnode中
        initComponent(vnode, insertedVnodeQueue)
        insert(parentElm, vnode.elm, refElm)
        if (isTrue(isReactivated)) {
          reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm)
        }
        return true
    }
}
```
```javascript
const componentVNodeHooks = {
	init: (vnode, hydrating) {
		if (
	      vnode.componentInstance &&
	      !vnode.componentInstance._isDestroyed &&
	      vnode.data.keepAlive
	    ) {
	      // kept-alive components, treat as a patch
	      const mountedNode: any = vnode // work around flow
	      componentVNodeHooks.prepatch(mountedNode, mountedNode)
	    } else {
	      const child = vnode.componentInstance = createComponentInstanceForVnode(
	        vnode,
	        activeInstance
	      )
	      child.$mount(hydrating ? vnode.elm : undefined, hydrating)
	    }
	}
}
```

因为有了keepAlive标志，第二次将不会执行$mount操作，而是调用组件自身的prepatch进行状态的更新；第二次渲染的时候`isReactivated`为true，所以会进入`reactivateComponent`阶段，最后会调用insert方法，插入组件的DOM节点

```javascript
function reactivateComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
	// ...
	insert(parentElm, vnode.elm, refElm)
}
```

