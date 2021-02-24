### 为什么会出现Fiber？
React Fiber是React16 版本中引入的新概念，那么为什么会引入React Fiber呢？这个问题在我们了解了React 15架构之后就会有答案了。那么，我们先来看一下React 15的架构；

React 15的结构可分为两层，其中一层是Reconciler（协调器），另外一层则是Rerender（渲染器）；
* Reconciler（协调器）-用来找出变化的组件
* Rerender（渲染器）-用来将变化的组件渲染到页面上

#### Reconciler（协调器）
当状态发生变化的时候，Reconciler（协调器）会做以下事情：
* 执行组件的render方法，将render方法返回的JSX转化为虚拟DOM
* 将最新获取到的虚拟DOM与上次更新的虚拟DOM做一次对比
* 对比两次虚拟DOM，找到本次更新中变化的DOM
* 通知Rerender（渲染器）将变化的DOM渲染到页面上

#### Rerender（渲染器）
在接受到Reconciler（协调器）的通知之后，Rerender（渲染器）负责将变化的DOM渲染到页面上；不过由于React是支持多平台，所以在不同的平台，使用的渲染器也是不一样的，在浏览器中，是我们最熟悉的ReactDOM负责渲染器的工作。

那么我们回到问题本身，即为什么会出现Fiber？
之所以会出现Fiber，是因为React 15架构有着一个致命的缺点，这个致命的缺点在于Reconciler协调器在做更新操作的时候，会递归遍历父组件及父组件下面所有的子组件，即使子组件本身的状态并没有发生改变，由于递归一旦开始，是没有办法中断的；如果递归时间一旦过长，就会导致页面的卡顿；
基于这个原因，React团队重写了整个架构，也就是Fiber架构；

### Fiber是如何解决问题的？
在了解Fiber架构之前，我们先来看另外一个问题，就是Fiber是如何解决问题的？
上文我们了解到出现Fiber的原因在于React 15是会递归更新组件的，递归时间过长就会导致页面的卡顿，那么Fiber解决问题的方法其实就是用了利用了时间切片，从字面意思上来看的话，时间切片好像切的是某个’时间‘，但其实不是的，实际上时间切片的意思是将一个非常庞大的任务分割成了N个小任务，然后再将这些个小人物扔到每一帧的空闲时间里面去执行；

在执行每一个小任务之前，React会先检查这一帧是否还有空余时间，如果没有的话，就会将控制权交还给浏览器，让浏览器去执行下面的渲染工作；这么一来，页面就不会由于JS线程占用时间过长而导致卡顿了；

即是实现了‘增量渲染’，实现了可中断与恢复，中断之后再恢复也依然可以使用中断之前的状态，那么这其实是和Generator有些类似的，但是Generator的一些缺陷使React 团队放弃了它：
* 类似于async，Generator也是有上下文效应的，意思就是说如果一个函数使用了Generaotr，那么调用它的函数也必须使用Generator
* Generator中的中间状态是相互关联的，即上一个状态会被用作当前状态的输入；如果执行的过程中，插入了其他优先级更高的任务，那么再次恢复状态的时候是无法获取之前状态的值；


### Fiber的实现方式
实现方式是requestIdleCallback这一API，requestIdleCallback的作用是在浏览器每一帧的空闲时间去执行优先级较低的任务；

但是React团队并没有使用这个API，而是内部实现了一个requestIdleCallback的polyfill，主要requestIdleCallback有以下两个问题：
* requestIdleCallback有浏览器兼容问题
* requestIdleCallback的FPS只有20，远远低于页面流畅度的要求（一般FPS达到60对用户来说才是比较流畅的）

首先，React中任务被分割成多个子任务，分批完成，在完成一部分任务之后，将控制权交还给浏览器，让浏览器去执行页面渲染工作；等浏览器完成剩下的工作后，由继续执行React任务；

简而言之，就是由浏览器给出时间切片，React在相应时间内完成任务，任务执行的时间一旦达到了时间切片的时间，那么就需要将控制权交还给浏览器；

### Fiber的架构
上文中我们知道React 15架构是不能支持异步更新从而需要重构，那么我们来看一下React 16的架构是如何支持异步更新的；

React 16的架构可分为三层，分别是Scheduler（调度器）、Reconciler（协调器）以及Rerender（渲染器）
* Scheduler（调度器）-负责调度任务的优先级，高优先级的优先进入Reconciler
* Reconciler（协调器）-负责找出变化的组件
*  Rerender（渲染器）-负责将变化的组件渲染到页面上

在新的架构模式下，工作模式如下：
每个任务都会被赋予一个优先级
当任务抵达调度器时，优先级更高的任务（记为A）会优先进入Reconciler层
当此时有一个优先级更高的任务（记为B），那么这个时候会先中断在Reconciler层执行的任务A，而优先将任务B推入Reconciler层；
当任务B执行完毕，新一轮的调度开始，之前中断的任务A会被重新推入Reconciler层，继续它的渲染；

新架构的核心在于三个关键字：可中断、可恢复、优先级

#### Scheduler（调度器）
这个需要提到我们上面说的requestIdleCallback，由于requestIdleCallback自身的一些问题，React团队内部实现了一个requestIdleCallback的polyfill，这就是Scheduler；Scheduler除了可以调度任务以外，还提供了其他多种调度任务优先级的配置
 
#### Reconciler（协调器）
在React 15和React 16中，Reconciler（协调器）的功能都是负责找出变化的组件，但不同的是，React 15是递归处理虚拟DOM的，而React 16的处理方式则是可中断的循环处理，且每次循环的时候会判断当前是否有剩余时间；

**那么当任务中断之后，Reconciler是如何解决DOM渲染不完全的问题呢？**

在React 16中，Reconciler和Rerender不再是交替工作，当Scheduler将任务推给Reconciler后，Reconciler会给每个节点打上增加/删除/修改的标记，而Scheduler和Reconciler的工作是在内存中进行的，所以，即使反复中断，用户也不会有感知。
当所有节点都被打上标记之后，会一并交给Rerender处理。

#### Rerender（渲染器）
和React 15一样，React 16的Rerender同样是负责将变化的组件渲染到页面上

### Fiber的工作原理
从上文中可以了解到，在React 15及之前，Reconciler采用递归的方式遍历虚拟DOM ，递归时间过长就会导致页面的卡顿；

为了解决这个问题，React 16将无法中断的递归遍历换成了可中断可恢复的循环遍历，那么，Fiber架构就应运而生；

#### Fiber的含义
Fiber有三层含义：
* 作为架构来说，Fiber增加了一个调度器，即Reconciler，负责调度任务的优先级
* 作为静态的数据结构来说，每一个Fiber 对应一个React Element，Fiber结点中保存了组件的相关信息、DOM结点等信息；
* 作为动态的工作单元来说，保存了Fiber本次更新的相关信息（组件更新的状态，需要执行的工作等）

#### Fiber的结构
一个Fiber结点包含了很多信息，大致可以分为以下三类

1）连接其他Fiber结点的属性
```javascript
// 指向父级Fiber节点
this.return = null;
// 指向子Fiber节点
this.child = null;
// 指向右边第一个兄弟Fiber节点
this.sibling = null;
```
2）作为静态数据的属性
```javascript
// Fiber对应组件的类型 Function/Class/Host...
this.tag = tag;
// key属性
this.key = key;
// 大部分情况同type，某些情况不同，比如FunctionComponent使用React.memo包裹
this.elementType = null;
// 对于 FunctionComponent，指函数本身，对于ClassComponent，指class，对于HostComponent，指DOM节点tagName
this.type = null;
// Fiber对应的真实DOM节点
this.stateNode = null;
```
3）作为动态工作单元的属性
```javascript
// 保存本次更新造成的状态改变相关信息
this.pendingProps = pendingProps;
this.memoizedProps = null;
this.updateQueue = null;
this.memoizedState = null;
this.dependencies = null;

this.mode = mode;

// 保存本次更新会造成的DOM操作
this.effectTag = NoEffect;
this.nextEffect = null;

this.firstEffect = null;
this.lastEffect = null;
```

如下两个字段保存调度优先级相关的信息

```javascript
// 调度优先级相关
this.lanes = NoLanes;
this.childLanes = NoLanes;
```

#### Fiber的工作原理
页面的渲染是一帧一帧去完成的，在渲染当前帧之前会先将将上一帧的内容完全清除掉，如果当前帧的计算时间过大，导致清除上一帧画面到绘制当前帧画面之间相隔时间比较久，就会出现白屏；

为了解决这个问题，React将当前帧提前在内存中绘制好，绘制完毕之后直接替换上一帧的画面；这种在内存中构建并直接替换的技术称为‘双缓存’。

React使用双缓存来完成Fiber数的构建与替换-对应的是DOM树的创建和更新；

##### 双缓存Fiber树
在React中，有两颗Fiber树，分别树当前页面中已经渲染的Fiber树，以及内存的Fiber树，当前页面中的Fiber树称为current fiber，内存中的Fiber树称为 workInprogress fiber，它们之间通过alternate属性连接；

```javascript
currentFiber.alternate === workInProgressFiber;
workInProgressFiber.alternate === currentFiber;
```
React 应用的根结点通过current指针在不同Fiber树的rootFiber之间进行切换来实现Fiber树的替换；

当workInProgressFiber 树构建完成提交给Rerender之后，React应用根结点的current指针便会指向workInProgressFiber 树，那么此时workInProgressFiber 树就变成了currentFiber 树；

每次状态的更新都会重新构建一棵新的workInProgressFiber树，通过current与workInProgress的替换，来实现DOM的更新
