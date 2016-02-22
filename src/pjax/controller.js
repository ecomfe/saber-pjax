/**
 * @file 页面导航控制器模块
 * @author wuhuiyao(sparklewhy@gmail.com)
 */
/* eslint-disable fecs-camelcase */
define(function (require) {

    var viewport = require('saber-viewport');
    var Resolver = require('saber-promise');
    var router = require('./router');
    var config = require('./config');
    var urlUtil = require('./url');
    var parseURL = urlUtil.parseURL;

    var exports = {};

    var _reqId;
    var _request;
    var _forceCacheActionMap = {};
    var _cacheActionMap = {};
    var _historyStack = [];

    /**
     * 请求的错误处理
     *
     * @inner
     * @param {Object} options 导航选项
     * @param {number} reqId 标识当前请求的 id
     * @param {Object} result 请求成功的结果信息
     * @param {string} result.content 显示的 html 内容
     * @param {string=} result.title 显示的标题
     * @param {Object=} result.data 页面要同步参数信息
     * @return {Object}
     */
    function onsuccess(options, reqId, result) {
        if (_reqId !== reqId || !result) {
            return;
        }

        exports.updateHistoryState(options, result.title);

        return {
            data: result.data,
            content: result.content
        };
    }

    /**
     * 请求的错误处理
     *
     * @inner
     * @param {Object} options 导航选项
     * @param {number} reqId 标识当前请求的 id
     * @param {*} err 错误信息
     */
    function onerror(options, reqId, err) {
        if (_reqId !== reqId) {
            return;
        }

        throw {err: err};
    }

    /**
     * 终止当前请求
     *
     * @inner
     */
    function abort() {
        if (_request) {
            _request.abort();
            _request = null;
        }
    }

    /**
     * 更新历史记录状态
     *
     * @param {Object} options 导航选项
     * @param {string} title 当前页面显示的标题
     */
    exports.updateHistoryState = function (options, title) {
        var state = options.state;
        if (title) {
            state.title = title;
        }

        title = state.title;
        if ((options.push || options.replace) && router.isSupportPjax()) {
            window.history.replaceState(state, title, options.url);
        }

        // 更新页面标题
        title && (document.title = title);
    };

    /**
     * 获取 pjax 页面请求的内容
     *
     * @param {Object} navOpts 导航选项
     * @param {Object} options 请求选项
     * @param {Object=} cache 当前请求的缓存内容，可选
     * @return {Promise}
     */
    exports.fetchPjaxContent = function (navOpts, options, cache) {
        abort();

        var url = navOpts.url;
        var reqId = _reqId = Date.now();

        if (cache) {
            return Resolver.resolved(onsuccess.call(this, navOpts, reqId, {
                title: cache.title
            }));
        }

        _request = config.fetch(url, options);
        return _request.then(
            onsuccess.bind(this, navOpts, reqId),
            onerror.bind(this, navOpts, reqId)
        );
    };

    /**
     * 初始化滚动条的位置，默认滚动到 url hash 指定的位置
     *
     * @param {Object} options 导航选项
     */
    exports.initScrollPosition = function (options) {
        var hash = parseURL(options.state.url).hash;
        var scrollTo = options.scrollTo;
        if (hash) {
            var name = decodeURIComponent(hash.slice(1));
            var target = document.getElementById(name)
                || document.getElementsByName(name)[0];
            target && (scrollTo = require('saber-dom').position(target).top);
        }

        if (typeof scrollTo === 'number') {
            window.scrollTo(0, scrollTo);
        }
    };

    /**
     * 获取 viewport 页面转场的 url
     *
     * @param {Object} state 当前访问的页面的状态信息
     * @param {string} path 当前访问的页面的 path
     * @param {boolean} cached 是否缓存当前访问的页面
     * @return {string}
     */
    exports.getViewportURL = function (state, path, cached) {
        return cached ? path : (path + '?' + state.id);
    };

    /**
     * 是否需要缓存
     *
     * @param {Object} route 当前路由信息
     * @return {boolean}
     */
    exports.isNeedCache = function (route) {
        return route.cached || route.navOpts.state.pjax;
    };

    /**
     * 获取缓存的 action
     *
     * @param {Object} route 当前路由信息
     * @return {?Object}
     */
    exports.getCache = function (route) {
        if (route.cached) {
            return _forceCacheActionMap[route.path];
        }
        return _cacheActionMap[route.navOpts.state.id];
    };

    /**
     * 缓存 action
     *
     * @param {Object} action 要缓存的 action
     */
    exports.addCache = function (action) {
        if (action.cached) {
            _forceCacheActionMap[action.path] = action;
            return;
        }

        var historyStack = _historyStack;
        var state = action.state;
        var cacheId = state.id;
        var found = historyStack.indexOf(cacheId);
        if (found !== -1) {
            historyStack.splice(found, 1);
            historyStack.push(cacheId);
            return;
        }

        historyStack.push(cacheId);
        _cacheActionMap[cacheId] = action;

        // 控制缓存的大小
        var maxSize = config.maxCacheSize;
        var len = historyStack.length;
        while (len > 0 && len > maxSize) {
            var id = historyStack.shift();
            var cacheAction = _cacheActionMap[id];

            if (cacheAction) {
                cacheAction.dispose();
                viewport.delCache(exports.getViewportURL(
                    cacheAction.state, cacheAction.path
                ));
            }

            delete _cacheActionMap[id];
            len--;
        }
    };

    /**
     * 移除当前路由的缓存
     *
     * @param {Object} route 当前路由信息
     * @param {Object} curAction 当前页面实例的 action
     */
    exports.removeCache = function (route, curAction) {
        var action;
        var state = route.navOpts.state;
        var path = route.path;
        var cached = route.cached;
        var viewportUrl = exports.getViewportURL(state, path, cached);
        if (cached) {
            action = _forceCacheActionMap[path];
        }
        else {
            var id = state.id;
            action = _cacheActionMap[id];
            if (action) {
                delete _cacheActionMap[id];

                var found = _historyStack.indexOf(id);
                if (found !== -1) {
                    _historyStack.splice(found, 1);
                }
            }
        }

        // 如果不是当前显示的action则进行dispose
        // 如果是当前显示的action，后续leave会处理
        if (action && action !== curAction) {
            action.dispose();
        }
        viewport.delCache(viewportUrl);
    };

    /**
     * 清空缓存
     *
     * @param {Object} curAction 当前页面实例的 action
     */
    exports.clearCache = function (curAction) {
        Object.keys(_cacheActionMap).some(function (id) {
            var action = _cacheActionMap[id];
            if (curAction !== action) {
                action.dispose();
            }
        });
        _cacheActionMap = {};
        _historyStack.length = 0;

        viewport.delCache();
    };

    return exports;
});
/* eslint-enable fecs-camelcase */
