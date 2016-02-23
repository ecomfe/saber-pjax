/**
 * @file router 模块
 * @author wuhuiyao(sparklewhy@gmail.com)
 */
/* eslint-disable fecs-camelcase */
define(function (require) {

    var Emitter = require('saber-emitter');
    var lang = require('saber-lang');
    var urlUtil = require('./url');
    var config = require('./config');
    var extend = lang.extend;
    var parseURL = urlUtil.parseURL;

    var exports = {};

    Emitter.mixin(exports);

    /**
     * 是否已经启用路由监听
     *
     * @inner
     * @type {boolean}
     */
    var _enabled;

    /**
     * 当前浏览状态信息
     *
     * @type {Object}
     */
    var _currState;

    function uniqueId() {
        return Date.now();
    }

    /**
     * 获取链接元素
     *
     * @inner
     * @param {Object} e 事件对象
     * @return {?HTMLElement}
     */
    function getLinkElem(e) {
        var ele = e.target;
        if (e.path) {
            for (var i = 0, item; item = e.path[i]; i++) {
                if (item.tagName === 'A') {
                    ele = item;
                    break;
                }
            }
        }
        else {
            while (ele && ele.tagName !== 'A') {
                ele = ele.parentNode;
            }
        }

        if (!ele) {
            return;
        }

        var target = ele.getAttribute('target');
        var href = ele.getAttribute('href');

        if (!href || (target && target !== '_self')) {
            return;
        }

        // 忽略 hash 链接
        if (href.charAt(0) === '#') {
            return;
        }

        return exports.isSupportPjax(ele) ? ele : null;
    }

    /**
     * 劫持全局的 click 事件
     *
     * @inner
     * @param {Event} e 事件参数
     */
    function hijackClick(e) {
        if (e.defaultPrevented) {
            return;
        }

        var link = getLinkElem(e);
        if (link) {
            e.preventDefault();

            var opts = {
                url: link.href,
                state: {
                    id: uniqueId(),
                    url: link.href,
                    title: link.getAttribute('title'),
                    pjax: true
                },
                prevState: _currState,
                push: true,
                target: link
            };

            /**
             * @event redirect pjax redirect 事件
             * @param {Object} e 事件参数
             * @param {string} e.url 要重定向的 url
             * @param {Object} e.state 要导航到的目标状态
             * @param {Object} e.prevState 当前的的历史状态信息
             * @param {boolean} e.push 是否 push 历史状态
             * @param {HTMLElement} e.target 点击的目标 dom 元素
             */
            exports.emit('redirect', opts);

            applyRoute(link, opts);
        }
    }

    /**
     * 历史导航事件处理，该导航只针对同域的导航才会触发，历史记录 api 不允许添加跨域的历史记录
     *
     * @inner
     * @param {Object} event 事件对象
     * @return {*}
     */
    function onPjaxPopstate(event) {
        var state = event.state;
        var targetUrl = state && state.url;
        if (!state || !targetUrl) {
            return;
        }

        var targetUrlInfo = parseURL(targetUrl);
        if (ignore(targetUrlInfo.pathname)) {
            return exports.reload(targetUrl);
        }

        // 忽略 相同 url 之间导航 或者 hash 之间导航
        var previousState = _currState;
        if (previousState && urlUtil.isSameUrl(previousState.url, targetUrl, true)) {
            return;
        }

        var direction;
        if (previousState) {
            direction = previousState.id < state.id ? 'forward' : 'back';
        }

        state.pjax = exports.isSupportPjax(targetUrlInfo);
        var navOpt = {
            url: targetUrl,
            state: state,
            prevState: previousState,
            direction: direction,
            historyNav: true
        };

        /**
         * @event popstate 历史导航事件
         * @param {Object} e 事件参数
         * @param {string} e.url 访问的 url
         * @param {Object} e.state 要导航到的目标历史状态
         * @param {Object} e.prevState 当前的的历史状态信息
         * @param {string=} e.direction 导航方向
         * @param {boolean} e.historyNav 是否是历史前进后退导航
         */
        exports.emit('popstate', navOpt);

        applyRoute(parseURL(state.url), navOpt);
    }

    /**
     * 变更 pjax 启用状态
     *
     * @inner
     * @param {Pjax} pjax pjax 实例
     */
    function togglePjax() {
        var handler = _enabled ? 'removeEventListener' : 'addEventListener';
        document.body[handler]('click', hijackClick);
        window[handler]('popstate', onPjaxPopstate);
        _enabled = !_enabled;
    }

    /**
     * 路由规则
     *
     * @type {Array.<Object>}
     */
    var _rules = [];

    /**
     * 判断是否已存在路由处理器
     *
     * @inner
     * @param {string|RegExp} path 路径
     * @return {number}
     */
    function indexOfHandler(path) {
        var index = -1;

        path = path && path.toString();
        _rules.some(function (item, i) {
            var raw = item.raw;
            if (path === raw) {
                index = i;
            }
            else if (raw && raw.toString() === path) { // toString是为了判断正则是否相等
                index = i;
            }
            return index !== -1;
        });

        return index;
    }

    /**
     * 从path中获取query
     * 针对正则表达式的规则
     *
     * @inner
     * @param {string} path 路径
     * @param {Object} item 路由信息
     * @return {Object}
     */
    function getParamsFromPath(path, item) {
        var res = {};
        var names = item.params || [];
        var params = path.match(item.path) || [];

        for (var i = 1, name; i < params.length; i++) {
            name = names[i - 1] || '$' + i;
            res[name] = decodeURIComponent(params[i]);
        }

        return res;
    }

    /**
     * 是否支持 pjax
     *
     * @inner
     * @type {boolean}
     */
    var _support = window.history
        && window.history.pushState
        && window.history.replaceState
        && !navigator.userAgent.match(
            /((iPod|iPhone|iPad).+\bOS\s+[1-4]\D|WebApps\/.+CFNetwork)/);

    /**
     * 是否正在等待处理器执行
     *
     * @type {boolean}
     */
    var _pending = false;

    /**
     * 等待调用处理器的参数
     *
     * @type {!Object}
     */
    var _waitingRoute;

    /**
     * url 忽略 root
     *
     * @inner
     * @param {string} url url
     * @return {string}
     */
    function ignoreRoot(url) {
        var root = config.root;
        if (url.charAt(0) === '/' && root && url.indexOf(root) === 0) {
            url = url.replace(root, '');
        }

        return url;
    }

    /**
     * 规划化 path
     * 如果路径指向文件夹（以`/`结尾）
     * 则添加index文件名
     *
     * @inner
     * @param {string} path 路径
     * @return {string}
     */
    function normalizePath(path) {
        if (path.charAt(path.length - 1) === '/') {
            path += config.index;
        }
        return path;
    }

    /**
     * 查找给定的路径名定义的路由规则
     *
     * @inner
     * @param {string} path 路径名称
     * @return {?Object}
     */
    function findRule(path) {
        var result;

        path = normalizePath(path);
        path = path && ignoreRoot(path);
        _rules.some(function (item) {
            if (item.path instanceof RegExp) {
                if (path && item.path.test(path)) {
                    result = item;
                }
            }
            else if (item.path === path) {
                result = item;
            }

            if (!item.path) {
                result = item;
            }

            return !!result;
        });

        return result;
    }

    /**
     * 根据URL调用路由处理器
     *
     * @inner
     * @param {Object} url url 对象
     * @param {Object} navOpts 导航信息
     * @param {Object=} options 参数
     */
    function applyRoute(url, navOpts, options) {
        // 只保存最后一次的待调用信息
        if (_pending) {
            _waitingRoute = {
                url: url,
                navOpts: navOpts,
                options: options
            };
            return;
        }

        function finish() {
            _pending = false;
            if (_waitingRoute) {
                applyRoute(_waitingRoute.url, _waitingRoute.navOpts, _waitingRoute.options);
                _waitingRoute = null;
            }
        }

        // 如果当前 url 跟要 push 一样，不添加。
        var urlInfo = parseURL(url);
        if (_support && navOpts.push && !navOpts.replace
            && window.location.href !== urlInfo.href
        ) {
            window.history.pushState(null, '', url);
        }

        _currState = navOpts.state;
        _pending = true;

        var handler;
        var search = url.search;
        var query = search ? urlUtil.parseQuery(search.substr(1)) : {};
        var params = {};
        var path = url.pathname;
        handler = findRule(path);
        if (handler && handler.path instanceof RegExp) {
            params = getParamsFromPath(path, handler);
        }

        if (!handler) {
            _waitingRoute = null;
            _pending = false;
            throw new Error('can not found route for: ' + path);
        }

        var args = [path, query, params, url.href, navOpts, options];
        if (handler.fn.length > args.length) {
            args.push(finish);
            handler.fn.apply(handler.thisArg, args);
        }
        else {
            handler.fn.apply(handler.thisArg, args);
            finish();
        }
    }

    /**
     * 处理RESTful风格的路径
     * 使用正则表达式
     *
     * @inner
     * @param {string} path 路径
     * @return {Object}
     */
    function restful(path) {
        var res = {
            params: []
        };

        res.path = path.replace(/:([^/]+)/g, function ($0, $1) {
            res.params.push($1);
            return '([^/]+)';
        });

        res.path = new RegExp(res.path + '$');

        return res;
    }

    /**
     * 添加路由规则
     *
     * @inner
     * @param {string} path 路径
     * @param {Function} fn 路由处理函数
     * @param {Object} options 规则的选项
     * @param {Object} thisArg 路由处理函数的this指针
     */
    function addRule(path, fn, options, thisArg) {
        var rule = {
            raw: path,
            path: path,
            fn: fn,
            options: options,
            thisArg: thisArg
        };

        if (!(path instanceof RegExp)
            && path && path.indexOf(':') >= 0
        ) {
            rule = extend(rule, restful(path));
        }

        _rules.push(rule);
    }

    /**
     * 是否忽略 url pjax 处理
     *
     * @inner
     * @param {string} path 要判断的路径
     * @return {boolean}
     */
    function ignore(path) {
        var rule = findRule(path);
        return !rule || rule.options.pjax === false;
    }

    /**
     * 设置配置信息
     *
     * @public
     * @param {Object} options 配置信息，见 {@link config.js}
     */
    exports.config = function (options) {
        options = options || {};
        // 修正root，添加头部的`/`并去掉末尾的'/'
        var root = options.root;
        if (root && root.charAt(root.length - 1) === '/') {
            root = options.root = root.substring(0, root.length - 1);
        }
        if (root && root.charAt(0) !== '/') {
            options.root = '/' + root;
        }
        Object.keys(config).forEach(function (key) {
            var value = options[key];
            if (value !== undefined) {
                config[key] = value;
            }
        });
    };

    /**
     * 添加路由规则
     *
     * @public
     * @param {string|RegExp=} path 路径
     * @param {function(path, query)} fn 路由处理函数
     * @param {Object} options 规则的选项
     * @param {Object=} thisArg 路由处理函数的this指针
     */
    exports.add = function (path, fn, options, thisArg) {
        if (indexOfHandler(path) >= 0) {
            throw new Error('path has been existed');
        }
        addRule(path, fn, options, thisArg);
    };

    /**
     * 删除路由规则
     *
     * @public
     * @param {string} path 路径
     */
    exports.remove = function (path) {
        var i = indexOfHandler(path);
        if (i >= 0) {
            _rules.splice(i, 1);
        }
    };

    /**
     * 当前浏览器或者指定的 url 是否支持 pjax
     *
     * @public
     * @param {string|Object=} url 要判断的 url，可选，默认，返回当前浏览器是否支持
     * @return {boolean}
     */
    exports.isSupportPjax = function (url) {
        if (!url) {
            return !!_support;
        }

        var urlInfo = parseURL(url);
        if (_enabled) {
            // 忽略跨域链接
            if (location.protocol !== urlInfo.protocol
                || location.host !== urlInfo.host
            ) {
                return;
            }

            // 忽略不支持 pjax 的链接
            if (ignore(urlInfo.pathname)) {
                return;
            }

            return true;
        }
    };

    /**
     * 清除所有路由规则
     *
     * @public
     */
    exports.clear = function () {
        _rules = [];
    };

    /**
     * 启动路由监听
     *
     * @public
     */
    exports.start = function () {
        var currUrl = window.location.href;
        _currState = {
            id: uniqueId(),
            url: currUrl,
            title: document.title
        };

        if (_support && !_enabled) {
            // 初始化当前访问的页面的状态
            var initialState = window.history.state;
            if (initialState && initialState.url) {
                _currState = initialState;
            }
            else {
                window.history.replaceState(_currState, document.title);
            }

            togglePjax();
        }

        _currState.pjax = exports.isSupportPjax(window.location);
        applyRoute(window.location, {
            url: currUrl,
            state: _currState,
            firstScreen: {
                data: config.firstScreenData
            }
        });
    };

    /**
     * 停止路由监听
     *
     * @public
     */
    exports.stop = function () {
        if (_enabled) {
            togglePjax();
            exports.clear();
            _waitingRoute = null;
        }
    };

    /**
     * 重新加载页面
     *
     * @public
     * @param {string=} url 要 reload url，可选，默认当前访问的 url
     */
    exports.reload = function (url) {
        if (url) {
            _support && window.history.replaceState(null, '', url);
            window.location.replace(url);
        }
        else {
            window.location.reload();
        }
    };

    /**
     * 路由跳转
     *
     * @public
     * @param {string} url 路径
     * @param {Object=} query 查询条件
     * @param {Object=} options 跳转参数
     * @param {boolean=} options.force 是否强制跳转，默认 false, 对于相同 url (忽略 hash 部分) 不会跳转
     * @param {boolean=} options.silent 是否静默跳转（不添加历史记录，只对同域有效）
     */
    exports.redirect = function (url, query, options) {
        options = options || {};
        url = urlUtil.updateURL(url, query);
        var urlInfo = parseURL(url);

        var force = options.force;
        if (urlUtil.isSameUrl(urlInfo.href, window.location.href, true) && !force) {
            return;
        }

        var silent = options.silent;
        if (exports.isSupportPjax(urlInfo)) {
            var navOpt = {
                url: url,
                state: {
                    id: uniqueId(),
                    url: url,
                    pjax: true
                },
                prevState: _currState,
                push: !silent
            };

            /**
             * @event redirect pjax 重定向事件
             * @param {Object} e 事件参数
             * @param {string} e.url 要重定向的 url
             * @param {Object} e.state 要导航到的目标状态
             * @param {Object} e.prevState 当前的的历史状态信息
             * @param {boolean} e.push 是否 push 历史状态
             */
            exports.emit('redirect', navOpt);

            applyRoute(urlInfo, navOpt, options);
        }
        else {
            if (silent) {
                exports.reload(url);
            }
            else {
                window.location.href = url;
            }
        }
    };

    return exports;
});
/* eslint-enable fecs-camelcase */
