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

    /**
     * @property {string=} className 视图的样式定义
     */
    config.className = 'index';

    /**
     * @property {Object} events View 监听的事件定义
     */
    config.events = {

        /**
         * @event init 视图创建初始化的事件
         */
        init: function () {
            console.log('init view...');
        },

        /**
         * @event ready 视图ready(dom ready)事件
         */
        ready: function () {
            console.log('ready view..');
            var html = this.template.render('hello');
            console.log(html);
        },

        /**
         * @event leave 当视图不被缓存，离开时候回触发改事件
         */
        leave: function () {
            console.log('leave view..');
        },

        /**
         * @event sleep 视图被缓存时候，会触发该事件，除非强制说明不使用 pjax 的页面
         *              或者 指定 noCache 为 true 的页面，否则需要考虑 sleep 时候一些
         *              页面组件或事件的临时销毁或移除监听
         */
        sleep: function () {
            console.log('sleep view..');
        },

        /**
         * @event revived 视图恢复事件
         */
        revived: function () {
            console.log('revived view..');
        },

        /**
         * @event dispose 销毁视图触发事件处理
         */
        dispose: function () {
            console.log('dispose view...');
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
