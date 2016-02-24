/**
 * @file indexModel Model
 * @author wuhuiyao@baidu.com
 */

define(function (require) {

    // 导入依赖模块
    var Resolver = require('saber-promise');

    /**
     * indexModel Model 定义
     *
     * @type {Object}
     */
    var config = {};

    /**
     * 获取 indexModel 视图初始化上下文数据
     *
     * @param {Object} query 查询参数
     * @return {Promise}
     * @override
     */
    config.fetch = function (query) {
        var data = {};

        // TODO

        return Resolver.resolved(data);
    };

    return config;
});
