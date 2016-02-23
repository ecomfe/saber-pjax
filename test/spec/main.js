/**
 * @file main spec
 * @author treelite(c.xinle@gmail.com)
 */

define(function (require) {

    var firework = require('saber-pjax');
    var router = require('saber-pjax/pjax/router');
    var viewport = require('saber-viewport');
    var Resolver = require('saber-promise');
    var extend = require('saber-lang/extend');

    function getViewEventsConf(viewEvents) {
        return {
            init: function () {
                viewEvents.push('init');
            },
            beforerender: function () {
                viewEvents.push('beforerender');
            },
            afterrender: function () {
                viewEvents.push('afterrender');
            },
            ready: function () {
                viewEvents.push('ready');
            },
            leave: function () {
                viewEvents.push('leave');
            },
            dispose: function () {
                viewEvents.push('dispose');
            },
            sleep: function () {
                viewEvents.push('sleep');
            },
            revived: function () {
                viewEvents.push('revived');
            }
        };
    }

    function getActionEventsConf(actionEvents) {
        return {
            init: function () {
                actionEvents.push('init');
            },
            enter: function () {
                actionEvents.push('enter');
            },
            ready: function () {
                actionEvents.push('ready');
            },
            complete: function () {
                actionEvents.push('complete');
            },
            leave: function () {
                actionEvents.push('leave');
            },
            sleep: function () {
                actionEvents.push('sleep');
            },
            revived: function () {
                actionEvents.push('revived');
            }
        };
    }

    describe('main', function () {

        describe('app', function () {
            var main = document.querySelector('.viewport');
            // 等待Action加载的时间
            var WAITE_TIME = 300;
            var actionEvents = [];
            var viewEvents = [];
            var viewConf = {events: getViewEventsConf(viewEvents)};
            var actionConf = {
                model: {},
                view: viewConf,
                events: getActionEventsConf(actionEvents)
            };
            firework.load({path: '/test/runner.html', action: actionConf});
            firework.start(main);

            function finish(done) {
                firework.delCachedAction();
                router.clear();
                done();
            }

            describe('load page', function () {

                it('init and redirect', function (done) {
                    var checkRestorEvents = function () {
                        actionEvents.length = 0;
                        viewEvents.length = 0;
                        history.go(-1);
                        setTimeout(function () {
                            expect(actionEvents).toEqual(['revived', 'complete']);
                            expect(viewEvents).toEqual(['revived']);
                            expect(main.innerHTML.trim())
                                .toEqual('<div><div class="index">index page</div></div>');
                            finish(done);
                        }, WAITE_TIME);
                    };

                    var checkLeavEvents = function () {
                        actionEvents.length = 0;
                        viewEvents.length = 0;

                        var pjaxViewEvents = [];
                        var pjaxActionEvents = [];
                        firework.load({path: '/test/page/pjax1.html', action: {
                            view: {
                                events: getViewEventsConf(pjaxViewEvents)
                            },
                            events: getActionEventsConf(pjaxActionEvents)
                        }});
                        router.redirect('/test/page/pjax1.html');
                        setTimeout(function () {
                            expect(pjaxActionEvents).toEqual(['init', 'ready', 'complete']);
                            expect(pjaxViewEvents).toEqual(['init', 'ready']);
                            expect(actionEvents).toEqual(['sleep']);
                            expect(viewEvents).toEqual(['sleep']);
                            expect(main.innerHTML.replace(/\s+/g, ''))
                                .toEqual('<div><div>page1</div></div>');

                            checkRestorEvents();
                        }, WAITE_TIME);
                    };

                    setTimeout(function () {
                        expect(actionEvents).toEqual(['init', 'ready', 'complete']);
                        expect(viewEvents).toEqual(['init', 'ready']);
                        checkLeavEvents();
                    }, WAITE_TIME);
                });


            });

        });

    });
});
