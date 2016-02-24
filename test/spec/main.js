/**
 * @file main spec
 * @author wuhuiyao(sparklewhy@gmail.com)
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

    function getActionEventsConf(actionEvents, data) {
        return {
            init: function () {
                actionEvents.push('init');
            },
            enter: function () {
                actionEvents.push('enter');
            },
            ready: function () {
                data && (data.data = this.model.getSyncData());
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

    function testActionWaiting(firework, main) {
        describe('test multiple actions wating', function () {
            var WAITE_TIME = 100;

            it('wait other action', function (done) {
                var p1 = extend({}, require('page/src/foo'));
                var p2 = extend({}, require('page/src/foo'));
                p1.events = {
                    ready: jasmine.createSpy('p11')
                };
                p2.events = {
                    ready: jasmine.createSpy('p12')
                };
                firework.load({path: '/test/page/foo1.html', action: p1});
                firework.load({path: '/test/page/foo2.html', action: p2});

                router.redirect('/test/page/foo1.html');
                router.redirect('/test/page/foo2.html');

                expect(p1.events.ready).not.toHaveBeenCalled();
                expect(p2.events.ready).not.toHaveBeenCalled();

                setTimeout(function () {
                    expect(p1.events.ready).toHaveBeenCalled();
                    expect(p2.events.ready).toHaveBeenCalled();

                    expect(main.innerHTML.replace(/\s+/g, ''))
                        .toEqual('<div><div>foo2</div></div>');

                    done();
                }, WAITE_TIME * 10);
            });

            it('only wait the last action', function (done) {
                var p1 = extend({}, require('page/src/foo'));
                var p2 = extend({}, require('page/src/foo'));
                var p3 = extend({}, require('page/src/foo'));
                p1.events = {
                    ready: jasmine.createSpy('p1')
                };
                p2.events = {
                    ready: jasmine.createSpy('p2')
                };
                p3.events = {
                    ready: jasmine.createSpy('p3')
                };
                firework.load({path: '/test/page/foo4.html', action: p1});
                firework.load({path: '/test/page/foo5.html', action: p2});
                firework.load({path: '/test/page/foo6.html', action: p3});

                router.redirect('/test/page/foo4.html');
                router.redirect('/test/page/foo5.html');
                router.redirect('/test/page/foo6.html');

                expect(p1.events.ready).not.toHaveBeenCalled();
                expect(p2.events.ready).not.toHaveBeenCalled();
                expect(p3.events.ready).not.toHaveBeenCalled();

                setTimeout(function () {
                    expect(p1.events.ready).toHaveBeenCalled();
                    expect(p2.events.ready).not.toHaveBeenCalled();
                    expect(p3.events.ready).toHaveBeenCalled();

                    expect(main.innerHTML.replace(/\s+/g, ''))
                        .toEqual('<div><div>foo6</div></div>');

                    done();
                }, WAITE_TIME);
            });
        });
    }

    describe('main', function () {

        describe('app', function () {
            var main = document.querySelector('.viewport');
            // 等待Action加载的时间
            var WAITE_TIME = 100;
            var actionEvents = [];
            var viewEvents = [];
            var viewConf = {events: getViewEventsConf(viewEvents)};
            var firstScreenInfo = {};
            var actionConf = {
                model: {},
                view: viewConf,
                events: getActionEventsConf(actionEvents, firstScreenInfo)
            };
            firework.load({path: '/test/runner.html', action: actionConf});
            firework.start(main, {
                firstScreenData: {
                    type: 'firstScreen',
                    a: 3
                }
            });

            function clear() {
                firework.delCachedAction();
                router.clear();
                firework.load({path: '/test/runner.html', action: actionConf});
            }

            describe('load page', function () {

                it('init', function (done) {
                    expect(actionEvents).toEqual(['init', 'ready', 'complete']);
                    expect(viewEvents).toEqual(['init', 'ready']);
                    expect(firstScreenInfo.data).toEqual({
                        type: 'firstScreen',
                        a: 3
                    });
                    done();
                });

                var pjaxViewEvents1 = [];
                var pjaxActionEvents1 = [];
                it('redirect', function (done) {
                    actionEvents.length = 0;
                    viewEvents.length = 0;

                    firework.load({
                        path: '/test/page/pjax1.html', action: {
                            view: {
                                events: getViewEventsConf(pjaxViewEvents1)
                            },
                            events: getActionEventsConf(pjaxActionEvents1)
                        }
                    });
                    router.redirect('/test/page/pjax1.html');
                    setTimeout(function () {
                        expect(pjaxActionEvents1).toEqual(['init', 'ready', 'complete']);
                        expect(pjaxViewEvents1).toEqual(['init', 'ready']);
                        expect(actionEvents).toEqual(['sleep']);
                        expect(viewEvents).toEqual(['sleep']);
                        expect(window.location.href).toEqual('http://localhost:8848/test/page/pjax1.html');
                        expect(main.innerHTML.replace(/\s+/g, ''))
                            .toEqual('<div><div>page1</div></div>');

                        done();
                    }, WAITE_TIME);
                });

                it('history navigate', function (done) {
                    actionEvents.length = 0;
                    viewEvents.length = 0;
                    history.go(-1);
                    setTimeout(function () {
                        expect(actionEvents).toEqual(['revived', 'complete']);
                        expect(viewEvents).toEqual(['revived']);
                        expect(window.location.href).toEqual('http://localhost:8848/test/runner.html');
                        expect(main.innerHTML.trim())
                            .toEqual('<div><div class="index">index page</div></div>');
                        done();
                    }, WAITE_TIME);
                });

                var pjaxViewEvents2 = [];
                var pjaxActionEvents2 = [];
                it('redirect nocache page', function (done) {
                    firework.load({
                        path: '/test/page/pjax2.html', noCache: true, action: {
                            view: {
                                events: getViewEventsConf(pjaxViewEvents2)
                            },
                            events: getActionEventsConf(pjaxActionEvents2)
                        }
                    });
                    router.redirect('/test/page/pjax2.html');
                    setTimeout(function () {
                        expect(pjaxActionEvents2).toEqual(['init', 'ready', 'complete']);
                        expect(pjaxViewEvents2).toEqual(['init', 'ready']);

                        expect(main.innerHTML.replace(/\s+/g, ''))
                            .toEqual('<div><div>page2</div></div>');

                        done();
                    }, WAITE_TIME);
                });

                it('leave nocache page', function (done) {
                    pjaxActionEvents2.length = 0;
                    pjaxViewEvents2.length = 0;

                    pjaxActionEvents1.length = 0;
                    pjaxViewEvents1.length = 0;

                    router.redirect('/test/page/pjax1.html');

                    setTimeout(function () {
                        expect(pjaxActionEvents2).toEqual(['leave']);
                        expect(pjaxViewEvents2).toEqual(['leave', 'dispose']);

                        expect(pjaxActionEvents1).toEqual(['init', 'ready', 'complete']);
                        expect(pjaxViewEvents1).toEqual(['init', 'ready']);

                        expect(main.innerHTML.replace(/\s+/g, ''))
                            .toEqual('<div><div>page1</div></div>');

                        done();
                    }, WAITE_TIME);

                });

                var pjaxViewEvents3 = [];
                var pjaxActionEvents3 = [];
                it('redirect force cache page', function (done) {
                    firework.load({
                        path: '/test/page/pjax3.html', cached: true, action: {
                            view: {
                                events: getViewEventsConf(pjaxViewEvents3)
                            },
                            events: getActionEventsConf(pjaxActionEvents3)
                        }
                    });
                    router.redirect('/test/page/pjax3.html');
                    setTimeout(function () {
                        expect(pjaxActionEvents3).toEqual(['init', 'ready', 'complete']);
                        expect(pjaxViewEvents3).toEqual(['init', 'ready']);

                        expect(main.innerHTML.replace(/\s+/g, ''))
                            .toEqual('<div><div>page3</div></div>');

                        done();
                    }, WAITE_TIME);
                });

                it('leave force cache page', function (done) {
                    pjaxActionEvents3.length = 0;
                    pjaxViewEvents3.length = 0;

                    pjaxActionEvents1.length = 0;
                    pjaxViewEvents1.length = 0;

                    history.go(-1);
                    setTimeout(function () {
                        expect(pjaxActionEvents1).toEqual(['revived', 'complete']);
                        expect(pjaxViewEvents1).toEqual(['revived']);
                        expect(pjaxActionEvents3).toEqual(['sleep']);
                        expect(pjaxViewEvents3).toEqual(['sleep']);

                        expect(main.innerHTML.replace(/\s+/g, ''))
                            .toEqual('<div><div>page1</div></div>');

                        done();
                    }, WAITE_TIME);
                });

                it('reenter force cache page', function (done) {
                    pjaxActionEvents3.length = 0;
                    pjaxViewEvents3.length = 0;

                    pjaxActionEvents1.length = 0;
                    pjaxViewEvents1.length = 0;

                    router.redirect('/test/page/pjax3.html');
                    setTimeout(function () {
                        expect(pjaxActionEvents1).toEqual(['sleep']);
                        expect(pjaxViewEvents1).toEqual(['sleep']);

                        expect(pjaxActionEvents3).toEqual(['revived', 'complete']);
                        expect(pjaxViewEvents3).toEqual(['revived']);

                        expect(main.innerHTML.replace(/\s+/g, ''))
                            .toEqual('<div><div>page3</div></div>');

                        done();
                    }, WAITE_TIME);
                });

                it('support async action', function (done) {
                    firework.load({
                        path: '/test/page/foo.html',
                        action: 'src/foo'
                    });

                    router.redirect('/test/page/foo.html');
                    setTimeout(function () {
                        expect(main.innerHTML.replace(/\s+/g, ''))
                            .toEqual('<div><div>foo</div></div>');

                        done();
                    }, WAITE_TIME);
                });


                var pjaxViewEvents4 = [];
                var pjaxActionEvents4 = [];
                var refreshInfo = {};
                it('support refresh action', function (done) {
                    firework.load({
                        path: '/test/page/refresh.html',
                        cached: true,
                        action: {
                            view: {events: getViewEventsConf(pjaxViewEvents4)},
                            events: getActionEventsConf(pjaxActionEvents4),
                            refresh: function (query, options) {
                                refreshInfo.query = query;
                                refreshInfo.options = options;
                                return Resolver.resolved();
                            }
                        }
                    });

                    router.redirect('/test/page/refresh.html');
                    setTimeout(function () {
                        pjaxViewEvents4.length = 0;
                        pjaxActionEvents4.length = 0;

                        // 刷新相同路径，啥也不会发生
                        router.redirect('/test/page/refresh.html', null, {type: 'test'});

                        setTimeout(function () {
                            expect(refreshInfo).toEqual({});
                            expect(pjaxActionEvents4).toEqual([]);
                            expect(pjaxViewEvents4).toEqual([]);
                            expect(location.href).toEqual('http://localhost:8848/test/page/refresh.html');
                            expect(main.innerHTML.replace(/\s+/g, ''))
                                .toEqual('<div><div>refresh</div></div>');

                            done();
                        }, WAITE_TIME);
                    }, WAITE_TIME);
                });

                it('support refresh action with force', function (done) {
                    pjaxViewEvents4.length = 0;
                    pjaxActionEvents4.length = 0;

                    // 刷新相同路径，如图指定 force，会重新初始化
                    router.redirect('/test/page/refresh.html', null, {force: true});
                    setTimeout(function () {
                        expect(refreshInfo).toEqual({});

                        expect(pjaxActionEvents4).toEqual(['sleep', 'revived', 'complete']);
                        expect(pjaxViewEvents4).toEqual(['sleep', 'revived']);

                        expect(location.href).toEqual('http://localhost:8848/test/page/refresh.html');
                        expect(main.innerHTML.replace(/\s+/g, ''))
                            .toEqual('<div><div>refresh</div></div>');

                        done();
                    }, WAITE_TIME);
                });

                it('support refresh action with force and noCache', function (done) {
                    pjaxViewEvents4.length = 0;
                    pjaxActionEvents4.length = 0;

                    router.redirect('/test/page/refresh.html', null, {
                        noCache: true,
                        force: true
                    });
                    setTimeout(function () {
                        expect(refreshInfo).toEqual({});

                        expect(pjaxActionEvents4).toEqual(['sleep', 'init', 'ready', 'complete']);
                        expect(pjaxViewEvents4).toEqual(['sleep', 'init', 'ready']);

                        expect(location.href).toEqual('http://localhost:8848/test/page/refresh.html');
                        expect(main.innerHTML.replace(/\s+/g, ''))
                            .toEqual('<div><div>refresh</div></div>');

                        done();
                    }, WAITE_TIME);
                });

                it('support refresh action with query', function (done) {
                    pjaxViewEvents4.length = 0;
                    pjaxActionEvents4.length = 0;

                    router.redirect('/test/page/refresh.html?a=3', {
                        a: 5,
                        b: 2
                    }, {type: 'test'});

                    setTimeout(function () {
                        expect(refreshInfo.query).toEqual({a: '5', b: '2'});
                        expect(refreshInfo.options).toEqual({type: 'test'});

                        expect(pjaxActionEvents4).toEqual([]);
                        expect(pjaxViewEvents4).toEqual([]);

                        expect(location.href).toEqual('http://localhost:8848/test/page/refresh.html?a=5&b=2');
                        expect(main.innerHTML.replace(/\s+/g, ''))
                            .toEqual('<div><div>refresh</div></div>');

                        done();
                    }, WAITE_TIME);
                });

                it('timeout', function (done) {
                    var config = require('saber-pjax/config');
                    config.timeout = 500;

                    var routerConfig = require('saber-pjax/pjax/config');
                    var rawFetch = routerConfig.fetch;
                    routerConfig.fetch = function (url) {
                        if (url.indexOf('pjax1.html') !== -1) {
                            var resolver = new Resolver();
                            setTimeout(function () {
                                resolver.resolve({content: 'timeout'});
                            }, 1000);
                            var promise = resolver.promise();
                            promise.abort = function () {
                            };
                            return promise;
                        }
                        return rawFetch.apply(this, arguments);
                    };

                    router.redirect('/test/page/pjax1.html');

                    setTimeout(function () {
                        expect(main.innerHTML.replace(/\s+/g, ''))
                            .not.toEqual('<div><div>page1</div></div>');
                        router.redirect('/test/page/pjax2.html');
                        setTimeout(function () {
                            expect(main.innerHTML.replace(/\s+/g, ''))
                                .toEqual('<div><div>page2</div></div>');
                            routerConfig.fetch = rawFetch;
                            done();
                        }, WAITE_TIME);
                    }, 1100);

                });

                testActionWaiting(firework, main);

                describe('global events', function () {

                    it('beforeload -> beforetransition -> afterload', function (done) {

                        router.redirect('/test/page/pjax2.html');
                        setTimeout(function () {
                            var events = [];
                            var backs = [];
                            var fronts = [];

                            firework.on('beforeload', function (back, front) {
                                events.push('beforeload');
                                backs.push(back);
                                fronts.push(front);
                            });

                            firework.on('beforetransition', function (back, front) {
                                events.push('beforetransition');
                                backs.push(back);
                                fronts.push(front);
                            });

                            firework.on('afterload', function (back, front) {
                                events.push('afterload');
                                backs.push(back);
                                fronts.push(front);
                            });

                            router.redirect('/test/page/pjax1.html?spec=events');

                            setTimeout(function () {
                                expect(events).toEqual(['beforeload', 'beforetransition', 'afterload']);
                                expect(fronts[0].route.url).toEqual('http://localhost:8848/test/page/pjax2.html');
                                expect(backs[0].route.url).toEqual('http://localhost:8848/test/page/pjax1.html?spec=events');
                                expect(backs[0].route.query).toEqual({spec: 'events'});
                                expect(fronts[0]).toBe(fronts[1]);
                                expect(fronts[0]).toBe(fronts[2]);
                                expect(backs[0]).toBe(backs[1]);
                                expect(backs[0]).toBe(backs[2]);
                                firework.off();
                                done();
                            }, WAITE_TIME);
                        }, WAITE_TIME);
                    });

                    it('error should emit when load action fail', function (done) {
                        firework.on('error', function (back, front) {
                            expect(back.route.url).toEqual('http://localhost:8848/error');
                            expect(front.route.url).toEqual('http://localhost:8848/test/page/pjax1.html?spec=events');
                            done();
                        });

                        firework.load({path: '/error', action: {}});

                        router.redirect('/error');
                    });
                });

                describe('filter', function () {

                    beforeEach(function () {
                        clear();
                    });

                    afterEach(function () {
                        firework.removeFilter();
                    });

                    it('can added by string url', function (done) {
                        var called = false;

                        function filter(route, next) {
                            called = true;
                            next();
                        }

                        firework.addFilter('/test/page/foo.html', filter);
                        firework.load({
                            path: '/test/page/foo.html',
                            action: {}
                        });

                        router.redirect('/test/page/foo.html');

                        setTimeout(function () {
                            expect(called).toBeTruthy();
                            done();
                        }, WAITE_TIME);
                    });

                    it('can added by RegExp', function (done) {
                        var called = false;

                        function filter(route, next) {
                            called = true;
                            next();
                        }

                        firework.addFilter(/\/foo/, filter);
                        firework.load({
                            path: '/test/page/foo2.html',
                            action: {}
                        });

                        router.redirect('/test/page/foo2.html');

                        setTimeout(function () {
                            expect(called).toBeTruthy();
                            done();
                        }, WAITE_TIME);
                    });

                    it('can remove', function (done) {
                        var count = 0;

                        function filter(route, next) {
                            count++;
                            next();
                        }

                        firework.addFilter('/test/page/foo.html', filter);
                        firework.addFilter('/test/page/foo1.html', filter);
                        firework.removeFilter('/test/page/foo1.html');

                        firework.load([
                            {
                                path: '/test/page/foo.html',
                                action: {}
                            },
                            {
                                path: '/test/page/foo1.html',
                                action: {}
                            },
                            {
                                path: '/test/page/foo2.html',
                                action: {}
                            }
                        ]);

                        router.redirect('/test/page/foo2.html');

                        setTimeout(function () {
                            expect(count).toBe(0);
                            firework.removeFilter();
                            router.redirect('/test/page/foo1.html');
                            setTimeout(function () {
                                expect(count).toBe(0);
                                done();
                            }, WAITE_TIME);
                        }, WAITE_TIME);
                    });

                    it('argument contains route info', function (done) {
                        var res;

                        function filter(route, next) {
                            res = route;
                            next();
                        }

                        firework.addFilter('/test/page/foo.html', filter);
                        firework.load({
                            path: '/test/page/foo.html',
                            action: {}
                        });

                        router.redirect('/test/page/foo.html?name=hello', null, {type: 'test'});

                        setTimeout(function () {
                            expect(res.url).toEqual('http://localhost:8848/test/page/foo.html?name=hello');
                            expect(res.path).toEqual('/test/page/foo.html');
                            expect(res.query).toEqual({name: 'hello'});
                            expect(res.options).toEqual({type: 'test'});
                            done();
                        }, WAITE_TIME);
                    });

                    it('can jump over the remainder filters', function (done) {
                        var call1 = false;
                        var call2 = false;
                        var call3 = false;
                        var call4 = false;

                        function filter1(route, next, jump) {
                            call1 = true;
                            jump(1);
                        }

                        function filter2(route, next, jump) {
                            call2 = true;
                            next();
                        }

                        function filter3(route, next, jump) {
                            call3 = true;
                            jump();
                        }

                        function filter4(route, next, jump) {
                            call4 = true;
                            next();
                        }

                        firework.addFilter('/test/page/foo2.html', filter1);
                        firework.addFilter('/test/page/foo2.html', filter2);
                        firework.addFilter('/test/page/foo2.html', filter3);
                        firework.addFilter('/test/page/foo2.html', filter4);

                        firework.load({
                            path: '/test/page/foo2.html',
                            action: {}
                        });

                        router.redirect('/test/page/foo2.html');

                        setTimeout(function () {
                            expect(call1).toBeTruthy();
                            expect(call2).toBeFalsy();
                            expect(call3).toBeTruthy();
                            expect(call4).toBeFalsy();
                            done();
                        }, WAITE_TIME);
                    });

                    it('support async', function (done) {
                        var call = false;

                        function filter(route, next) {
                            setTimeout(next, 0);
                            call = true;
                        }

                        firework.addFilter('/test/page/foo6.html', filter);
                        firework.load({
                            path: '/test/page/foo6.html',
                            action: {}
                        });

                        router.redirect('/test/page/foo6.html');

                        setTimeout(function () {
                            expect(call).toBeTruthy();
                            expect(main.innerHTML.replace(/\s+/g, ''))
                                .toEqual('<div><div>foo6</div></div>');
                            done();
                        }, WAITE_TIME);
                    });

                    it('support default filter', function (done) {
                        var count = 0;

                        function filter(route, next) {
                            count++;
                            next();
                        }

                        firework.addFilter(filter);

                        firework.load({
                            path: '/test/page/foo1.html',
                            action: {}
                        });
                        firework.load({
                            path: '/test/page/foo2.html',
                            action: {}
                        });

                        router.redirect('/test/page/foo2.html');

                        setTimeout(function () {
                            expect(count).toBe(1);
                            router.redirect('/test/page/foo1.html');
                            setTimeout(function () {
                                expect(count).toBe(2);
                                done();
                            }, WAITE_TIME);
                        }, WAITE_TIME);
                    });
                });

            });

            require('./main2').test(firework, main);

        });

    });
});
