/**
 * @file url 工具方法
 * @author wuhuiyao(sparklewhy@gmail.com)
 */

define(function (require) {

    var extend = require('saber-lang/extend');
    var exports = {};

    function removeHash(url) {
        var pos = url.indexOf('#');
        if (pos >= 0) {
            return url.substring(0, pos);
        }
        return url;
    }

    /**
     * 判断给定的 url 是否一样
     *
     * @param {string} a 要比较的 url
     * @param {string} b 要比较的 url
     * @param {boolean=} ignoreHash 是否忽略 hash 部分不一样，可选，默认 false
     * @return {boolean}
     */
    exports.isSameUrl = function (a, b, ignoreHash) {
        return ignoreHash ? removeHash(a) === removeHash(b) : a === b;
    };

    /**
     * 解析 url
     *
     * @param {string} url 要解析的 url
     * @return {Object}
     */
    exports.parseURL = function (url) {
        if (typeof url !== 'string') {
            return url;
        }
        var a = document.createElement('a');
        a.href = url;
        return a;
    };

    /**
     * 解析给定的查询字符串，不包括 `?` 起始字符及 `#` 部分信息。
     *
     * @param {string} str query 字符串
     * @return {Object}
     */
    exports.parseQuery = function (str) {
        var pairs = str.split('&');
        var query = {};

        for (var i = 0, len = pairs.length; i < len; i++) {
            var pair = pairs[i];
            if (!pair) {
                continue;
            }

            var index = pair.indexOf('=');
            var key = index < 0
                ? decodeURIComponent(pair)
                : decodeURIComponent(pair.slice(0, index));
            var value = index < 0
                ? true
                : decodeURIComponent(pair.slice(index + 1));

            // 已经存在这个参数，且新的值不为空时，把原来的值变成数组
            if (query.hasOwnProperty(key)) {
                if (value !== true) {
                    query[key] = [].concat(query[key], value);
                }
            }
            else {
                query[key] = value;
            }
        }

        return query;
    };

    /**
     * 将参数对象转换为URL字符串
     *
     * @param {Object} query 参数对象
     * @return {string} 转换后的URL字符串，相当于search部分
     */
    exports.serialize = function (query) {
        if (!query) {
            return '';
        }

        var search = [];
        for (var key in query) {
            if (query.hasOwnProperty(key)) {
                var value = query[key];

                // 如果`value` 是数组，其 `toString` 会自动转为逗号分隔的字符串
                search.push(
                    encodeURIComponent(key) + '='
                    + encodeURIComponent(value)
                );
            }
        }

        return search.join('&');
    };

    /**
     * 更新给定的 url 的查询参数信息
     *
     * @param {string} url 要更新的 url
     * @param {Object} query 要更新的 query 信息
     * @return {string}
     */
    exports.updateURL = function (url, query) {
        if (!query || !Object.keys(query).length) {
            return url;
        }

        var urlInfo = exports.parseURL(url);
        var search = urlInfo.search;
        var queryInfo = search ? exports.parseQuery(search.substr(1)) : {};
        queryInfo = extend(queryInfo, query || {});

        // 不考虑 authority info
        var newUrl = urlInfo.protocol + '//' + urlInfo.host + urlInfo.pathname;
        var querStr = exports.serialize(queryInfo);
        newUrl += (querStr ? '?' : '') + querStr;
        newUrl += urlInfo.hash;
        return newUrl;
    };

    return exports;
});
