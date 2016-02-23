/**
 * @file main
 * @author treelite(c.xinle@gmail.com)
 *         wuhuiyao(sparklewhy@gmail.com)
 */

define(function (require) {

    var Emitter = require('saber-emitter');
    var Resolver = require('saber-promise');
    var FastClick = require('fastclick');
    var extend = require('saber-lang/extend');
    var bind = require('saber-lang/bind');
    var curry = require('saber-lang/curry');
    var viewport = require('saber-viewport');
    var mm = require('saber-mm');

    var globalConfig = require('./config');
    var controller = require('./pjax/controller');


    var filters = [];
    var cur = {};

    var exports = {};
    Emitter.mixin(exports);

    /**
     * 获取全局配置的附加处理器
     *
     * @inner
     * @param {string} name 处理器名称
     * @return {?Function}
     */
    function getProcessor(name) {
        var processor = globalConfig.processor || {};
        return processor[name];
    }

    /**
     * action加载完成
     *
     * @inner
     * @param {Object} route 路由信息
     */
    function finishLoad(route) {
        route.done();
    }

    /**
     * 保存当前Action相关信息
     *
     * @inner
     * @param {Action} action action对象
     * @param {Object} route 路由信息
     * @param {Page} page 页面对象
     */
    function dumpInfo(action, route, page) {
        var cached = route.needCache;
        if (action) {
            cur.action = action;
            if (cached) {
                controller.addCache(action);
            }
        }
        else {
            cur.action = null;
        }

        cur.route = route;
        cur.page = page;
        cur.path = route.path;
        cur.cached = cached;
    }

    /**
     * 初始化当前路由的 action 实例
     *
     * @inner
     * @param {Object} route 当前的路由信息
     * @param {Array} result 要初始化的 action 及 action 数据
     * @param {Object} page 当前的页面实例
     * @param {boolean} firstScreen 是否首屏展现
     * @return {Promise}
     */
    function initAction(route, result, page, firstScreen) {
        var action = result[0];
        if (route.hasCache) {
            return action.wakeup(route.path, route.query, route.options).then(
                function () {
                    return {action: action};
                }
            );
        }

        var pageInfo = result[1];

        !firstScreen && (page.main.innerHTML = pageInfo.content || '');

        action.state = route.navOpts.state;
        action.cached = route.cached;
        action.set(route.path);

        // 视图与数据已经 ready 了 跳过enter
        page && action.view.set(page.main);

        // 使用同步数据填充首屏 model
        var model = action.model;
        model.fill(getSyncData('model'));
        model.set(globalConfig.syncDataKey, pageInfo.data);

        return Resolver.resolved({action: action});
    }

    function finishActionInit(route, action) {
        if (route.hasCache) {
            // 已缓存时需要调用 revived
            action.revived();
        }
        else {
            // 没有缓存时需要 ready 调用
            action.ready();
        }
        action.complete();
    }

    /**
     * 创建页面转场
     *
     * @inner
     * @param {Object} route 当前路由信息
     * @param {Object} page 当前页面实例
     * @param {Function} fireEvent 触发事件的发射器
     * @param {number} timer 计时器 id
     * @return {{start: Function, end: Function, fail: Function}}
     */
    function createPageTransition(route, page, fireEvent, timer) {
        // 获取页面转场配置参数
        var transition = route.transition || {};
        // 调用全局配置中的处理函数进行转场参数处理
        var processor = getProcessor('transition');
        if (processor) {
            extend(transition, processor(route, cur.route) || {});
        }

        // 如果请求路径没有变化取消转场效果
        if (route.path === cur.path) {
            transition.type = false;
        }

        var action;

        /**
         * 开始转场动画
         *
         * @inner
         * @param {Object} info 加载信息
         * @param {boolean} info.error 是否发生了加载错误
         * @param {Action} info.action 加载成功的 action
         * @return {Promise}
         */
        var startTransition = function (info) {
            var hasError = info.error;
            action = info.action;

            // 清除状态重置定时器，防止干扰转场动画
            clearTimeout(timer);

            fireEvent('beforetransition');

            dumpInfo(!hasError && action, route, page);

            if (hasError) {
                return page
                    .enter(transition.type, transition)
                    .then(bind(Resolver.rejected, Resolver));
            }
            return page.enter(transition.type, transition);
        };

        /**
         * 转场正常完成处理
         *
         * @inner
         */
        var finishTransition = function () {
            if (action) {
                finishActionInit(route, action);
                controller.initScrollPosition(route.navOpts);
            }
            action = null;
            finishLoad(route);
        };

        /**
         * action加载失败处理
         *
         * @inner
         * @return {Promise}
         */
        var enterFail = function () {
            fireEvent('error', arguments[0]);
            return startTransition({error: true});
        };

        return {
            start: startTransition,
            end: finishTransition,
            fail: enterFail
        };
    }

    /**
     * 启动Action
     *
     * @inner
     * @param {Object} route 路由信息
     * @param {string} route.path 请求路径
     * @param {Object} route.action action配置
     * @param {Object} route.query 查询条件
     * @param {boolean=} route.cached 是否缓存action
     * @param {Object=} route.transition 转场配置
     * @param {Object} route.options 跳转参数
     * @param {boolean} route.options.force 强制跳转
     * @param {boolean=} route.options.noCache 不使用缓存action
     * @param {Object=} action 当前路由缓存的 Action 对象，可能不存在，如果不存在重新加载
     */
    function enterAction(route, action) {
        var options = route.options || {};
        var page;
        var fireEvent = function (eventName) {
            // 触发全局事件
            exports.emit(eventName, {
                route: route,
                action: action,
                page: page
            }, {
                route: cur.route,
                action: cur.action,
                page: cur.page
            }, arguments[1]);
        };

        // 触发 beforeload 事件
        fireEvent('beforeload');

        // 首先尝试从 cache 中取 action 没有从 cache 中获取到 action 就创建
        var navOpts = route.navOpts;
        var firstScreen = navOpts.firstScreen;
        var loadActionPromise = action
            ? Resolver.resolved(action)
            : mm.create(route.action);
        var loadPageContent = firstScreen
            ? Resolver.resolved(firstScreen)
            : controller.fetchPjaxContent(navOpts, options, action && action.state);

        // 在转场结束时触发 afterlaod 事件
        var cached = route.needCache;
        var pageUrl = controller.getViewportURL(navOpts.state, route.path, route.cached);
        var transition;
        if (firstScreen) {
            page = viewport.front(
                pageUrl,
                {cached: cached}
            );
            transition = {
                end: function () {
                    finishActionInit(route, action);

                    fireEvent('afterload');

                    dumpInfo(action, route, page);
                    finishLoad(route);
                }
            };
        }
        else {
            page = viewport.load(
                pageUrl,
                {
                    cached: cached,
                    noCache: options.noCache
                }
            );
            page.on('afterenter', curry(fireEvent, 'afterload'));

            // 设置加载超时计时器 防止加载时间过长
            var timer = setTimeout(curry(finishLoad, route), globalConfig.timeout);
            transition = createPageTransition(route, page, fireEvent, timer);
        }

        Resolver.all([loadActionPromise, loadPageContent])
            .then(
                function (result) {
                    action = result[0];
                    var promise = initAction(route, result, page, firstScreen);
                    var start = transition.start;
                    if (start) {
                        promise = promise.then(start);
                    }
                    return promise;
                },
                transition.fail)
            .then(transition.end)
            .then(null, curry(finishLoad, route));
    }

    /**
     * 加载Action
     *
     * @inner
     * @param {Object} route 路由信息
     * @param {string} route.path 请求路径
     * @param {Object} route.action action配置
     * @param {Object} route.query 查询条件
     * @param {boolean=} route.cached 是否缓存action
     * @param {Object=} route.transition 转场配置
     * @param {Object} route.options 跳转参数
     * @param {boolean} route.options.force 强制跳转
     * @param {boolean=} route.options.noCache 不使用缓存action
     */
    function loadAction(route) {
        var options = route.options || {};

        // 如果路径未发生变化只需要刷新当前action
        if (route.path === cur.path
            && !options.force
            && cur.action   // 会有存在cur.path但不存在cur.action的情况，比如action加载失败
            && cur.action.refresh
        ) {
            controller.updateHistoryState(route.navOpts);
            var ret = cur.action.refresh(route.query, options);
            // 兼容refresh同步的情况
            if (!ret || typeof ret.then !== 'function') {
                finishLoad(route);
            }
            else {
                ret.then(curry(finishLoad, route));
            }
            return;
        }

        if (options.noCache) {
            controller.removeCache(route, cur.action);
        }

        // 处理当前正在工作的action
        if (cur.action) {
            cur.action[cur.cached ? 'sleep' : 'leave']();
        }

        var cacheAction = controller.getCache(route);
        route.hasCache = !!cacheAction;

        enterAction(route, cacheAction);
    }

    /**
     * 执行filter
     *
     * @inner
     * @param {Object} route 路由信息
     * @return {Promise}
     */
    function executeFilter(route) {
        var resolver = new Resolver();
        var index = 0;

        /**
         * 跳过后续的filter
         * 如果不带参数则跳过剩余所有的filter
         *
         * @inner
         * @param {number} num 跳过后续filter的数量
         */
        function jump(num) {
            index += num || filters.length;
            next();
        }

        /**
         * 执行下一个filter
         *
         * @inner
         */
        function next() {
            var item = filters[index++];

            if (!item) {
                resolver.resolve(route);
            }
            else if (!item.url
                || (item.url instanceof RegExp && item.url.test(route.path))
                || item.url === route.path
            ) {
                item.filter(route, next, jump);
            }
            else {
                next();
            }
        }

        next();

        return resolver.promise();
    }

    /**
     * 获取前后端同步的数据
     *
     * @inner
     * @param {string=} name 数据名称
     * @return {*}
     */
    function getSyncData(name) {
        var store = extend({}, window[globalConfig.syncDataKey]);
        return name ? store[name] : store;
    }

    /**
     * 尝试加载Action
     *
     * @inner
     * @param {Object} route 路由信息
     */
    function tryLoadAction(route) {
        var rawRoute = route;
        var path = route.path;
        route.needCache = controller.isNeedCache(route);

        // 处理filter的执行结果
        function beforeLoad(route) {
            // 如果改变了path则以静默形式重新加载
            if (path !== route.path) {
                globalConfig.router.redirect(route.path, route.query, route.options);
                finishLoad(rawRoute);
            }
            else {
                loadAction(route);
            }
        }

        // 执行filter
        executeFilter(route).then(beforeLoad);
    }

    /**
     * 路由导向
     *
     * @inner
     * @param {option} config 路由配置
     * @return {Function}
     */
    function routeTo(config) {
        /* eslint-disable max-params */
        return function (path, query, params, url, navOpts, options, done) {
            // 设置当前的路由信息
            var route = extend({}, config);
            route.path = path;
            // 考虑再三，还是将query与params合并吧
            // 同构、同构，前后端思路要统一嘛
            route.query = extend(params, query);
            route.options = options;
            route.navOpts = navOpts;
            route.url = url;
            route.done = done;

            // 尝试加载Action
            tryLoadAction(route);
        };
        /* eslint-enable max-params */
    }

    /**
     * 扩展全局配置项
     *
     * @inner
     * @param {Object} options 配置项
     * @return {Object}
     */
    function extendGlobalConfig(options) {
        var config = extend(globalConfig, options);

        // 扩展templateData
        config.templateData = extend({}, getSyncData('templateData'), config.templateData);

        if (!Array.isArray(config.template)) {
            config.template = [config.template];
        }

        // 如果没有指定路由器则使用默认的hash路由
        if (!config.router) {
            config.router = require('./pjax/router');
        }

        return config;
    }

    /**
     * 获取saber-mm的配置信息
     *
     * @inner
     * @param {Object} options 配置项
     * @return {Object}
     */
    function getConfig4mm(options) {
        var res = {};
        var names = [
            'template', 'templateConfig', 'templateData',
            'router', 'Presenter', 'View', 'Model'
        ];

        names.forEach(function (name) {
            if (name in options) {
                res[name] = options[name];
            }
        });

        return res;
    }

    var routes = [];

    /**
     * 加载路由配置信息
     *
     * @public
     * @param {Object} paths 路由配置
     */
    exports.load = function (paths) {
        if (!Array.isArray(paths)) {
            paths = [paths];
        }

        // 如果还没有制定router
        // 则先缓存路由信息
        // 否则直接添加路由
        if (!globalConfig.router) {
            routes = routes.concat(paths);
        }
        else {
            paths.forEach(function (item) {
                globalConfig.router.add(item.path, routeTo(item), item);
            });
        }
    };

    /**
     * 启动框架
     *
     * @public
     * @param {HTMLElement} main 主元素
     * @param {Object} options 全局配置信息 完整配置参考`./config.js`
     */
    exports.start = function (main, options) {
        // 扩展全局配置信息
        var config = extendGlobalConfig(options);

        var router = config.router;

        mm.config(getConfig4mm(config));

        // 初始化viewport
        viewport.init(main, config.viewport);

        // 启用无延迟点击
        FastClick.attach(document.body);

        // 添加路由
        routes.forEach(function (item) {
            router.add(item.path, routeTo(item), item);
        });

        router.config(config);

        // 启动路由
        router.start();
    };

    /**
     * 添加filter
     *
     * @public
     * @param {string|RegExp=} url url
     * @param {Function} filter 过滤器
     */
    exports.addFilter = function (url, filter) {
        if (arguments.length === 1) {
            filter = url;
            url = null;
        }

        filters.push({
            url: url,
            filter: filter
        });
    };

    /**
     * 删除filter
     *
     * @public
     * @param {string|RegExp=} url url
     */
    exports.removeFilter = function (url) {
        if (!url) {
            filters = [];
        }
        else {
            var index;
            var res = filters.some(function (item, i) {
                index = i;
                return item.url.toString() === url.toString();
            });
            if (res) {
                filters.splice(index, 1);
            }
        }
    };

    /**
     * 删除缓存的action
     *
     * @public
     * @param {string} path 路径
     */
    exports.delCachedAction = function () {
        controller.clearCache(cur.action);
    };

    /**
     * 停止App
     * For Test
     *
     * @public
     */
    exports.stop = function () {
        var router = globalConfig.router;

        router.stop();
        router.clear();
        routes = [];

        filters = [];
        cur = {};

        exports.delCachedAction();
    };

    /**
    * 获取同步的数据
    *
    * @public
    * @param {name=} 数据名称
    * @return {*}
    */
    exports.getSyncData = getSyncData;

    return exports;

});
