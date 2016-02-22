/**
 * @file 配置信息
 * @author treelite(c.xinle@gmail.com)
 *         wuhuiyao(sparklewhy@gmail.com)
 */

define({

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
     * 最大缓存的大小，默认 `20`
     *
     * @type {number}
     */
    maxCacheSize: 20,

    /**
     * 获取页面 pjax 内容接口定义
     *
     * @type {function(string, Object):Promise}
     */
    fetch: null,

    /**
     * 首屏页面数据
     *
     * @type {Object}
     */
    firstScreenData: null

});
