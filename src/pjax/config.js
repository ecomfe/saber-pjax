/**
 * @file 配置信息
 * @author treelite(c.xinle@gmail.com)
 *         wuhuiyao(sparklewhy@gmail.com)
 */

define(function (require) {

    var exports = {

        /**
         * index文件名
         *
         * @type {string}
         */
        index: '',

        /**
         * 默认的根路径
         * 目前只对popstate有意义
         *
         * @type {string}
         */
        root: '',

        /**
         * 最大页面缓存的数量大小，默认 `20`
         *
         * @type {number}
         */
        maxCacheSize: 20,

        /**
         * 发送 pjax 请求的携带参数
         *
         * @type {Object|function(string, Object):Object}
         */
        pjaxParams: {_isPjax: true},

        /**
         * 解析 pjax 请求响应内容
         *
         * @param {*} res 响应的内容
         * @return {{title: string, data: Object, content: string}}
         */
        pjaxParser: function (res) {
            return {
                content: res
            };
        },

        /**
         * 发送 pjax 请求的 ajax 接口
         *
         * @type {Object}
         */
        ajax: require('saber-ajax'),

        /**
         * 获取页面 pjax 内容接口定义
         *
         * @param {string} url 请求页面 url
         * @param {Object} options 附加请求选项
         * @return {Promise}
         */
        fetch: function (url, options) {
            var ajax = exports.ajax;

            var customParams = exports.pjaxParams;
            var pjaxParams = typeof customParams === 'function'
                ? customParams(url, options)
                : customParams;
            var rawPromise = ajax.get(url, pjaxParams);
            var promise = rawPromise.then(
                function (res) {
                    var parser = exports.pjaxParser;
                    if (typeof parser === 'function') {
                        return parser(res, url, options);
                    }
                    return res;
                },
                function (err) {
                    if (err === 'abort') {
                        return;
                    }

                    throw err;
                }
            );
            promise.abort = function () {
                return rawPromise.abort();
            };
            return promise;
        },

        /**
         * 首屏页面数据
         *
         * @type {Object}
         */
        firstScreenData: null

    };

    return exports;
});
