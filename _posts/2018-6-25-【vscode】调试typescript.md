---
layout:     post
date:       2018-06-25
author:     WWJ
header-img: img/post-bg-map.png
catalog: true
tags: typescript
---

# 【vscode】调试typescript
1. 在命令行中输入`tsc -v`如果报错的话，那么就说明还没有typescript模块，需要输入以下命令
`npm install -g typescript`
2. 选择一个文件夹进入命令行并依次输入以下命令
```javascript
mkdir typescript
cd typescript\
tsc --init
```
完成之后会在项目的根目录下面生成一个`tsconfig.json`的文件，配置如下
```javascript
{
    "compilerOptions": {
        "target": "es5",
        "noImplicitAny": false,
        "module": "commonjs",
        "removeComments": true,
        "sourceMap": false,
        "outDir": "./dist"
    }
}
```
3. 按住`ctrl+shift+b`，如果是初次配置会弹出提示
![enter image description here](https://image.ibb.co/kOHjc8/ts_setting.png)
点击配置的`icon`，会在`.vscode`文件夹下面生成`tasks.json`，输入以下配置项
```javascript
{
	// See https://go.microsoft.com/fwlink/?LinkId=733558
    // for thedocumentation about the tasks.json format
    "version": "0.1.0",
    "command": "tsc",
    "isShellCommand": true,
    //-p 指定目录；-w watch,检测文件改变自动编译
    "args": [
        "-p",
        ".",
        "-w"
    ],
    "showOutput": "always",
    "problemMatcher": "$tsc"
}
```
4. 按下`f5`，会在`.vscode`文件夹下面生成`launch.json`，输入以下配置项
```javascript
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "launch",
            "type": "node",
            "request": "launch",
            "program": "${workspaceRoot}/dist/main.js",
            "args": [],
            "cwd": "${workspaceRoot}",
            "protocol": "inspector"
        }
    ]
}
```
5. 在根目录下面新建`dist/main.js`和`src/main.ts`
![enter image description here](https://image.ibb.co/eZM5jo/ts_dir.png)
6. 开启第一个小例子，在`main.ts`文件下面输入
```javascript
class Animal {
    greeting:string;
    constructor(message:string) {
        this.greeting = message
    }
    sayHi() {
        console.log(`hi! ${this.greeting}`)
    }
}
class Cat extends Animal{
    constructor(name : string) {
        super(name)
    }
}
let cat = new Cat('tom')
cat.sayHi()
```
7. 再依次按`ctrl+shift+b`和`f5`，会在控制台输出
![enter image description here](https://image.ibb.co/cnwG78/ts_output.png)

