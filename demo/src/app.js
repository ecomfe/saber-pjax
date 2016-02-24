/**
 * @file app
 * @author ()
 */

define(function (require) {

    var Resolver = require('saber-promise');
    var firework = require('saber-pjax');
    var ajax = require('saber-ajax');
    var slide = require('saber-viewport/transition/slide');

    // FIXME
    // Only For Debug
    // 关闭Promise的异常捕获，方便调试
    Resolver.disableExceptionCapture();

    // saber-firework全局配置信息

    // 设置路由器
    var config = {
        processor: {
            /**
             * 处理转场的方向
             *
             * @param {Object} back 要返回的页面的action配置
             * @param {Object} front 当前展现的页面的action配置
             */
            transition: function (back, front) {
                var options = {};

                // 页面初始化时没有原始的route信息
                front = front || {};
                // index 值自行在 Action 路由配置里加上
                if (back.index && front.index) {
                    options.direction = back.index > front.index
                        ? slide.RIGHT
                        : slide.LEFT;
                }
                return options;
            }
        },
        viewport: {
            transition: 'slide'
        },
        pjaxParser: function (res) {
            return {
                title: 'test',
                content: res,
                data: {}
            };
        }
    };

    // 加载路由配置
    firework.load(require('./config'));

    var loading = require('./loading');
    firework.on('beforeload', function (to, from) {
        console.log(to.route.ubs);
        //loading.show();
    });

    firework.on('afterload', function (to, from) {
        //loading.hide();
    });

    return {
        init: function (pageData) {
            // 启动应用
            config.firstScreenData = pageData;
            firework.start('viewport', config);
        }
    };

});
