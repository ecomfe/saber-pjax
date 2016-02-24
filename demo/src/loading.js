/**
 * @file 页面 loading 相关的工具方法
 * @author sparklewhy@gmail.com
 */

define(function (require) {
    var dom = require('saber-dom');
    var gmask;
    var gloading;

    /**
     * 显示/隐藏 全局 loading
     *
     * @inner
     * @param {boolean} isShow 是否显示
     */
    function toggleGlobalLoading(isShow) {
        if (!gmask) {
            gmask = dom.g('gmask');
            gloading = dom.g('gloading');
        }

        var handler = isShow ? 'show' : 'hide';
        dom[handler](gmask);
        dom[handler](gloading);
    }

    return {

        /**
         * 显示全局 loading
         */
        show: function () {
            toggleGlobalLoading(true);
        },

        /**
         * 隐藏全局 loading
         */
        hide: function () {
            toggleGlobalLoading(false);
        }
    };
});
