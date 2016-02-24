/**
 * @file index.js Action
 * @author wuhuiyao@baidu.com
 */

define(function (require) {

    /**
     * index.js Action 定义
     *
     * @type {Object}
     */
    var config = {};

    /**
     * @property {Object} view 视图
     */
    config.view = require('./indexView');

    /**
     * @property {Object} model 模型
     */
    config.model = require('./indexModel');

    /**
     * @property {Object} events Action 监听的事件定义
     */
    config.events = {

        /**
         * @event init action 创建初始化事件
         */
        init: function () {
            console.log('init action...');
        },

        /**
         * @event ready 视图ready(dom ready)事件
         */
        ready: function () {
            // TODO
            console.log('ready action...');
        },

        /**
         * @event sleep action 被缓存离开时候，会触发该事件，除非强制说明不使用 pjax 的页面
         *              或者 指定 noCache 为 true 的页面，否则需要考虑 sleep 时候一些
         *              页面组件或事件的临时销毁或移除监听
         */
        sleep: function () {
            console.log('sleep action...');
        },

        /**
         * @event revived action 恢复事件
         */
        revived: function () {
            console.log('revived action...');
        },

        /**
         * @event complete action ready 后或者视图恢复时候触发事件
         */
        complete: function () {
            console.log('complete action...');
        },

        /**
         * @event leave action leave action 不被缓存，离开触发事件
         */
        leave: function () {
            console.log('leave action...');
        },

        /**
         * index.js model xx 事件处理
         */
        'model:xx': function () {
            // TODO
        },

        /**
         * index.js view xx 事件处理
         */
        'view:xx': function () {
            // TODO
        }
    };

    return config;
});
