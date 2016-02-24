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
         * @event ready 视图ready(dom ready)事件
         */
        ready: function () {
            // TODO
            console.log('ready action...');
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
