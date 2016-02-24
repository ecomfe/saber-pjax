/**
 * @file 路由配置
 * @author ()
 */

define(function (require) {

    return [
        {
            path: '/demo/index.html',
            action: 'index',
            index: 1,
            ubs: {
                cat: 'home',
                page: 'index'
            }
            // noCache: true // 可以使用该选项强制不使用缓存
        },
        {
            path: '/demo/cached.html',
            action: {
                events: {
                    ready: function () {
                        console.log('cached ready action')
                    },
                    wakeup: function () {
                        console.log('wakeup cached')
                    }
                }
            },
            cached: true
        },
        {
            path: '/demo/normal.html',
            action: {
                events: {
                    ready: function () {
                        console.log('normal ready action')
                    },
                    wakeup: function () {
                        console.log('wakeup normal')
                    }
                }
            },
            pjax: false
        },
        {
            path: '/demo/pjax.html',
            index: 2,
            action: {
                events: {
                    ready: function () {
                        console.log('pjax ready action')
                    },
                    wakeup: function () {
                        console.log('wakeup pjax')
                    }
                }
            }
        },
        {
            path: '/demo/refresh.html',
            action: {
                events: {
                    ready: function () {
                        console.log('refresh ready action')
                    },
                    wakeup: function () {
                        console.log('wakeup refresh')
                    }
                },
                refresh: function (query, options) {
                    this.view.query('#query').innerHTML = JSON.stringify(query || {});
                }
            }
        }
    ];

});
