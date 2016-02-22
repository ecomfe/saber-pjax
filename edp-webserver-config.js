/**
 * @file WebServer 配置
 * @author edpx-mobile
 */

/* globals home, livereload, html2js, autostylus, stylus, weinre, proxy, file, proxyNoneExists, markdown */

// 引入 rider 支持
var epr = require('./edp-rider-config');
var riderUI = require('rider-ui');
var autoresponse = require('autoresponse');

// 指定匹配版本的 stylus
exports.stylus = epr.stylus;

// 端口
exports.port = 8848;

// 网站根目录
exports.documentRoot = process.cwd();

// 当路径为目录时，是否显示文件夹内文件列表
exports.directoryIndexes = true;

function stylusPlugin(style) {
    style.use(epr.stylusPlugin);
    style.use(riderUI());
}

/* handlers
 * 支持expressjs的path的写法，可以通过request.parameters来获取url中的参数
 * 如:
 *  {
 *      location: '/lib/:filename',
 *      handler: function(context) {
 *          console.log(context.request.parameters);
 *      }
 *  }
 *
 * 如果访问http://127.0.0.1:8848/lib/config.js
 *  handler将打印出{"filename": "config.js"}
 */
exports.getLocations = function () {
    return [
        {
            location: /\.styl($|\?)/,
            handler: [
                file(),
                stylus({
                    stylus: epr.stylus,
                    use: stylusPlugin
                })
            ]
        },
        {
            location: /^[^\?]+?\.tpl\.js($|\?)/,
            handler: [
                html2js()
            ]
        },
        {
            location: /\.md($|\?)/,
            handler: [
                markdown()
            ]
        },

        // 添加 mock 处理器
        autoresponse('edp', {
            logLevel: 'debug',
            root: require('path').join(__dirname, 'demo'),
            get: {
                match: function (reqPathName) { // mock all `/xx/xx` path
                    return !/\.\w+$/.test(reqPathName);
                },
                mock: function (reqURL) {
                    var path = reqURL.pathname.replace(/^\/+/, '') || 'index';
                    return path + '.js';
                }
            }
        }),

        {
            location: /^.*$/,
            handler: [
                file(),
                // 推荐使用 Chrome 开发者工具调试页面
                // 如需单独调试 Android 4.4- 设备，可启用 Weinre 相关配置
                // weinre({port: 8889}),
                livereload(),
                proxyNoneExists()
            ]
        }
    ];
};

/* eslint-disable guard-for-in */
exports.injectResource = function (res) {
    for (var key in res) {
        global[key] = res[key];
    }
};
