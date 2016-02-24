/**
 * @file indexView View
 * @author wuhuiyao@baidu.com
 */

define(function (require) {

    // 导入依赖模块
    var extend = require('saber-lang/extend');
    var curry = require('saber-lang/curry');
    var bind = require('saber-lang/bind');
    var dom = require('saber-dom');

    /**
     * indexView View 定义
     *
     * @type {Object}
     */
    var config = {};

    /**
     * @property {Array.<string>|string} template 视图用到模板定义
     */
    config.template = require('./indexView.tpl');
    // TODO view template compile

    /**
     * @property {Object} events View 监听的事件定义
     */
    config.events = {

        /**
         * @event ready 视图ready(dom ready)事件
         */
        ready: function () {
            console.log('ready view...');
            var html = this.template.render('hello');
            console.log(html);
        },

        /**
         * @event dispose 销毁视图触发事件处理
         */
        dispose: function () {
            // TODO
        }

    };

    /**
     * @property {Object} domEvents View 监听的dom事件定义
     */
    config.domEvents = {
        'click:.test': function () {
            alert('click');
        }
    };

    return config;

});
