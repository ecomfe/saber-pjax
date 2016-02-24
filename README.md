saber-pjax
========

[![Build Status](https://travis-ci.org/ecomfe/saber-pjax.svg?branch=master)](https://travis-ci.org/ecomfe/saber-pjax)

>  基于 `saber-mm` 和 `pjax` 移动端多页面应用开发框架

## Usage

```javascript
// saber-pjax 使用跟 saber-fireworks 使用方式是一样的
var saberPjax = require('saber-pjax');

// 全局配置信息
var config = {
    pjaxParser: function (res) {
        return {
            title: 'test',
            content: res,
            data: {}
        };
    }
};

// 加载路由配置
saberPjax.load([
    {
        path: '/index',
        action: require('index'),
        noCache: true // 强制不缓存
    },
    {
        path: '/user/account',
        action: 'user/account/main',
        pjax: false // 不使用 pjax 方式导航
    }
]);

saberPjax.start('viewport', config);
```

更多使用例子，可以参考 `test case` 和 `demo`。

## saber-pjax vs saber-firworks

`saber-pjax` 基于 `pjax` 技术进行导航路由，路由实现跟 `saber` 同构版 `rebase` 类似，都是基于 html5 history api，并通过拦截链接点击来进行路由导航控制。

`saber-pjax` 的 `mvp` 框架实现基于 [saber-mm](https://github.com/ecomfe/saber-mm)，有些具体使用细节需要注意下：

* 不支持如下事件，由于 `saber-pjax` 渲染逻辑默认都是后端渲染完成的

    * Presenter `enter` 事件
    * View `beforerender`/`afterrender` 事件

* View 不支持 `templateMainTarget` 配置项

* Model 扩展 api

    * getPageQuery(key): 获取当前访问页面的查询参数信息
    
        ```javascript
        var allQueryInfo = model.getPageQuery();
        var specifyQueryKeyValue = model.getPageQuery(key);
        ```
        
    * getSyncData(key): 获取当前页面同步的数据信息
        
        ```javascript
        var allSyncDataInfo = model.getSyncData();
        var specifyDataKeyValue = model.getSyncData(key);
        ```
            
* 不支持全局配置项

    * path: 默认访问路径
    
* 新增全局配置项
    
    * pageQueryKey: 页面查询 key，访问的页面的 url 查询参数信息，可以通过 model 扩展 api: `getPageQuery` 或者，或者直接通过 `model.get(pageQueryKey)` 获取
    
    * ajax `Object` `optional`: 导航请求页面内容使用的 `ajax` 模块，默认使用 `saber-ajax` 模块

    * fetch `Function` `optional`: 请求导航页面内容的接口，默认基于默认 `ajax` 模块实现
    
    * pjaxParams `Function|Object` `optional`: 请求导航页面内容发送 pjax 请求的参数，默认 `{_pjax: true}`，后端实现可以通过是否存在 `_pjax` 参考来控制返回的是页面片段还是完整的页面文档
    
    * pjaxParser `Function` `optional`: 可以通过该接口实现对于响应内容的解析预处理
    
        ```javascript
        {
            pjaxParser: function (response) {
                // 对于响应的内容，默认 response 为字符串，进行预处理
                
                return {
                    title: '浏览器页面的标题',
                    content: '页面要显示的 html 片段',
                    data: Object // 页面要同步的页面数据，可以通过 model 扩展 api `getSyncData` 
                                 // 来获取该数据，对于首屏要同步的数据可以通过下面 `firstScreenData` 来设置
                };
            }
        }
        ```
    * firstScreenData `Object` `optional`: 设置首屏要同步的数据
    
    * maxCacheSize `number` `optional`: 历史导航记录栈允许缓存的最大 页面（action）实例数量，默认 `20`。对于路由规则里，强制使用 `cached` 为 true 的缓存页面不算在导航历史记录栈里，使用独立的缓存。
    
* 路由规则新增的路由配置项
    
    * noCache `boolean` `optional`: 是否强制不缓存，框架默认历史前进后退会使用缓存，可以通过该选项来强制不使用缓存
    
    * pjax `boolean` `optional`: 是否对当前路由禁用 `pjax` 导航，默认都是支持的，对于不支持的路由，访问该链接，会导致页面重新加载，而不是通过发送 `ajax` 请求进行页面局部区域的更新。


## Reference

关于 `saber` 使用更多文档可以参考 [这里](http://ecomfe.github.io/saber/doc/)。
