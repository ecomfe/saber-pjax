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


    function testRouteEvents(firework, main, clear) {
        describe('route global events', function () {
            // 等待Action加载的时间
            var WAITE_TIME = 100;

            beforeEach(function () {
                clear();
            });

            it('should emit redirect', function (done) {

                firework.load({
                    path: '/test/page/link.html',
                    action: {}
                });

                var called;
                var redirectOpt;
                var redirectListener = function (options) {
                    called = true;
                    redirectOpt = options;
                };
                router.on('redirect', redirectListener);
                router.redirect('/test/page/link.html');

                setTimeout(function () {
                    expect(called).toBeTruthy();
                    expect(redirectOpt.state).toBeDefined();
                    expect(redirectOpt.prevState).toBeDefined();
                    expect(redirectOpt.url).toEqual('http://localhost:8848/test/page/link.html');
                    expect(redirectOpt.push).toEqual(true);

                    router.off();
                    done();
                }, WAITE_TIME);
            });

            it('should emit redirect by click href', function (done) {

                firework.load({
                    path: '/test/page/foo5.html',
                    action: {}
                });

                var called;
                var redirectOpt;
                var redirectListener = function (options) {
                    called = true;
                    redirectOpt = options;
                };
                router.on('redirect', redirectListener);
                document.getElementById('foo5').click();

                setTimeout(function () {
                    expect(called).toBeTruthy();
                    expect(redirectOpt.state).toBeDefined();
                    expect(redirectOpt.prevState).toBeDefined();
                    expect(redirectOpt.url).toEqual('http://localhost:8848/test/page/foo5.html');
                    expect(redirectOpt.push).toEqual(true);
                    expect(document.title).toEqual('foo5');
                    expect(location.href).toEqual('http://localhost:8848/test/page/foo5.html');

                    router.off();
                    done();
                }, WAITE_TIME);
            });

            it('should emit popstate event', function (done) {
                firework.load([
                    {
                        path: '/test/page/foo.html',
                        action: {}
                    },
                    {
                        path: '/test/page/foo1.html',
                        action: {}
                    }
                ]);

                var callCount = 0;
                var navOpts;
                var popstateListener = function (options) {
                    callCount++;
                    navOpts = options;
                };
                router.on('popstate', popstateListener);

                router.redirect('/test/page/foo.html');
                setTimeout(function () {
                    router.redirect('/test/page/foo1.html');

                    setTimeout(function () {
                        history.go(-1);
                        setTimeout(function () {
                            expect(callCount).toEqual(1);
                            expect(navOpts.historyNav).toEqual(true);
                            expect(navOpts.direction).toEqual('back');
                            expect(navOpts.state).toBeDefined();
                            expect(navOpts.prevState).toBeDefined();
                            expect(navOpts.url).toEqual('http://localhost:8848/test/page/foo.html');

                            history.go(1);
                            setTimeout(function () {
                                expect(callCount).toEqual(2);
                                expect(navOpts.historyNav).toEqual(true);
                                expect(navOpts.direction).toEqual('forward');
                                expect(navOpts.state).toBeDefined();
                                expect(navOpts.prevState).toBeDefined();
                                expect(navOpts.url).toEqual('http://localhost:8848/test/page/foo1.html');
                                router.off();
                                done();
                            }, WAITE_TIME);
                        }, WAITE_TIME);
                    }, WAITE_TIME);
                }, WAITE_TIME);
            });
        });
    }

    function testNotSupportPjax(firework, main, clear) {
        describe('not support pjax', function () {
            // 等待Action加载的时间
            var WAITE_TIME = 300;

            beforeEach(function () {
                clear();
            });

            it('router pjax option setting false', function (done) {
                var rawSupportPjax = router.isSupportPjax;
                router.isSupportPjax = function () {
                    return false;
                };

                var rawReload = router.reload;
                var reloadSpy = jasmine.createSpy('reload');
                router.reload = reloadSpy;

                firework.load({
                    path: '/test/page/foo2.html',
                    pjax: false,
                    action: {
                    }
                });

                router.redirect('/test/page/foo2.html');
                setTimeout(function () {
                    expect(reloadSpy).toHaveBeenCalled();

                    router.isSupportPjax = rawSupportPjax;
                    router.reload = rawReload;

                    done();
                }, WAITE_TIME);
            });
        });
    }

    function testScroll(firework, main, clear) {
        describe('redirect with hash url', function () {
            // 等待Action加载的时间
            var WAITE_TIME = 300;

            beforeEach(function () {
                clear();
            });

            it('should scroll to top', function (done) {
                firework.load([
                    {
                        path: '/test/page/more.html',
                        action: {
                        }
                    },
                    {
                        path: '/test/page/more2.html',
                        action: {
                        }
                    }
                ]);

                router.redirect('/test/page/more.html');
                setTimeout(function () {
                    window.scrollTo(0, 500);
                    router.redirect('/test/page/more2.html');
                    setTimeout(function () {
                        var scrollPos = window.pageYOffset
                            || document.documentElement.scrollTop
                            || document.body.scrollTop;
                        expect(scrollPos).toEqual(0);
                        done();
                    }, WAITE_TIME * 5);
                }, WAITE_TIME);
            });

            it('should scroll to hash position', function (done) {
                firework.load({
                    path: '/test/page/hash.html',
                    action: {
                    }
                });

                router.redirect('/test/page/hash.html#here');
                setTimeout(function () {
                    var scrollPos = window.pageYOffset
                        || document.documentElement.scrollTop
                        || document.body.scrollTop;
                    expect(scrollPos === 1684).toBeTruthy();

                    done();
                }, WAITE_TIME);
            });
        });
    }

    function testModelExtension(firework, main, clear) {
        describe('model extension api', function () {
            // 等待Action加载的时间
            var WAITE_TIME = 300;

            beforeEach(function () {
                clear();
            });

            it('getSyncData', function (done) {
                var config = require('saber-pjax/pjax/config');
                var rawPjaxParser = config.pjaxParser;
                router.config({
                    pjaxParser: function (res) {
                        return {
                            content: res,
                            title: 'myPage2',
                            data: {
                                a: 3,
                                b: 5
                            }
                        };
                    }
                });
                var model;
                firework.load({
                    path: '/test/page/foo2.html',
                    action: {
                        ready: function () {
                            model = this.model;
                        }
                    }
                });

                router.redirect('/test/page/foo2.html');
                setTimeout(function () {
                    expect(model.getSyncData()).toEqual({
                        a: 3,
                        b: 5
                    });
                    expect(model.getSyncData('a')).toEqual(3);

                    config.pjaxParser = rawPjaxParser;
                    done();
                }, WAITE_TIME);
            });

            it('getPageQuery', function (done) {
                var model;
                var revived;
                firework.load({
                    path: '/test/page/foo3.html',
                    cached: true,
                    action: {
                        ready: function () {
                            model = this.model;
                        },
                        revived: function () {
                            revived = true;
                        }
                    }
                });

                router.redirect('/test/page/foo3.html?a=3', {b: 11}, {test: 'abc'});
                setTimeout(function () {
                    expect(model.getPageQuery()).toEqual({
                        a: '3',
                        b: '11'
                    });
                    expect(model.getPageQuery('a')).toEqual('3');

                    router.redirect('/test/page/foo3.html?a=m&d=2');
                    setTimeout(function () {
                        expect(revived).toBeTruthy();
                        expect(model.getPageQuery()).toEqual({
                            a: 'm',
                            d: '2'
                        });

                        done();
                    });
                }, WAITE_TIME);
            });
        });
    }

    function testRouterOptions(firework, main, clear) {
        describe('router options', function () {
            // 等待Action加载的时间
            var WAITE_TIME = 300;

            beforeEach(function () {
                clear();
            });

            it('pjax fetch', function (done) {
                var config = require('saber-pjax/pjax/config');
                var rawFetch = config.fetch;
                var fetchUrl;
                var fetchOptions
                config.fetch = function (url, options) {
                    fetchUrl = url;
                    fetchOptions = options;
                    return rawFetch.apply(this, arguments);
                };

                firework.load({
                    path: '/test/page/foo2.html',
                    action: {}
                });

                router.redirect('/test/page/foo2.html');
                setTimeout(function () {
                    expect(fetchUrl).toEqual('http://localhost:8848/test/page/foo2.html');
                    expect(fetchOptions).toEqual({});

                    router.redirect('/test/page/foo2.html', {a: 3}, {q: 'a'});
                    setTimeout(function () {
                        expect(fetchUrl).toEqual('http://localhost:8848/test/page/foo2.html?a=3');
                        expect(fetchOptions).toEqual({q: 'a'});

                        config.fetch = rawFetch;
                        done();
                    }, WAITE_TIME);
                }, WAITE_TIME);
            });

            it('pjax params with plain object', function (done) {
                var config = require('saber-pjax/pjax/config');
                var rawPajaxParams = config.pjaxParams;
                config.pjaxParams = {
                    from: 'ajax'
                };
                var pjaxUrl;
                var pjaxParams;
                var rawAjax = config.ajax;
                config.ajax = {
                    get: function (url, params) {
                        pjaxUrl = url;
                        pjaxParams = params;

                        var promise = Resolver.resolved('<div>foo</div>');
                        promise.abort = function () {};
                        return promise;
                    }
                };

                firework.load({
                    path: '/test/page/foo.html',
                    action: {}
                });

                router.redirect('/test/page/foo.html');
                setTimeout(function () {
                    expect(pjaxUrl).toEqual('http://localhost:8848/test/page/foo.html');
                    expect(pjaxParams).toEqual({
                        from: 'ajax'
                    });

                    config.ajax = rawAjax;
                    config.pjaxParams = rawPajaxParams;
                    done();
                }, WAITE_TIME);
            });

            it('pjax params with function', function (done) {
                var config = require('saber-pjax/pjax/config');
                var rawPajaxParams = config.pjaxParams;
                var paramUrl;
                var paramOpts;
                config.pjaxParams = function (url, options) {
                    paramUrl = url;
                    paramOpts = options;
                    return {custom: 'pjax'};
                };
                var pjaxUrl;
                var pjaxParams;
                var rawAjax = config.ajax;
                config.ajax = {
                    get: function (url, params) {
                        pjaxUrl = url;
                        pjaxParams = params;

                        var promise = Resolver.resolved('<div>foo2</div>');
                        promise.abort = function () {};
                        return promise;
                    }
                };

                firework.load({
                    path: '/test/page/foo2.html',
                    action: {}
                });

                router.redirect('/test/page/foo2.html', null, {a: 3});
                setTimeout(function () {
                    expect(paramUrl).toEqual('http://localhost:8848/test/page/foo2.html');
                    expect(paramOpts).toEqual({a: 3});
                    expect(pjaxUrl).toEqual('http://localhost:8848/test/page/foo2.html');
                    expect(pjaxParams).toEqual({custom: 'pjax'});

                    config.ajax = rawAjax;
                    config.pjaxParams = rawPajaxParams;
                    done();
                }, WAITE_TIME);
            });

            it('pjax response paraser', function (done) {
                var config = require('saber-pjax/pjax/config');
                var rawPjaxParser = config.pjaxParser;
                var fetchRes;
                config.pjaxParser = function (res) {
                    fetchRes = res;
                    return {
                        content: res,
                        title: 'myPage',
                        data: {
                            a: 3,
                            b: 5
                        }
                    };
                };


                var syncData;
                firework.load({
                    path: '/test/page/foo.html',
                    action: {
                        events: {
                            complete: function () {
                                syncData = this.model.getSyncData();
                            }
                        }
                    }
                });

                router.redirect('/test/page/foo.html', null, {a: 3});
                setTimeout(function () {
                    expect(fetchRes.trim()).toEqual('<div>foo</div>');
                    expect(syncData).toEqual({
                        a: 3,
                        b: 5
                    });
                    expect(document.title).toEqual('myPage');

                    config.pjaxParser = rawPjaxParser;
                    done();
                }, WAITE_TIME);
            });

            it('max cache size', function (done) {
                var config = require('saber-pjax/pjax/config');
                var rawMaxCacheSize = config.maxCacheSize;
                config.maxCacheSize = 1;

                var sleeCalled;
                var readCalled;
                firework.load([
                    {
                        path: '/test/page/foo2.html',
                        action: {
                            events: {
                                sleep: function () {
                                    sleeCalled = true;
                                    readCalled = false;
                                },
                                ready: function () {
                                    sleeCalled = false;
                                    readCalled = true;
                                }
                            }
                        }
                    },
                    {
                        path: '/test/page/foo.html',
                        action: {
                        }
                    }
                ]);

                router.redirect('/test/page/foo2.html');
                setTimeout(function () {
                    expect(sleeCalled).not.toBeTruthy();
                    expect(readCalled).toBeTruthy();

                    router.redirect('/test/page/foo.html');
                    setTimeout(function () {
                        expect(sleeCalled).toBeTruthy();
                        expect(readCalled).not.toBeTruthy();

                        history.go(-1);
                        setTimeout(function () {
                            expect(sleeCalled).not.toBeTruthy();
                            expect(readCalled).toBeTruthy();

                            config.maxCacheSize = rawMaxCacheSize;
                            done();
                        }, WAITE_TIME);
                    }, WAITE_TIME);
                }, WAITE_TIME);
            });

            it('root option', function (done) {
                var config = require('saber-pjax/pjax/config');
                var rawRoot = config.root;
                router.config({
                    root: 'test/page'
                });

                var readyCalled3;
                var readyCalled2;
                var readyCalled;
                var readyCalledX;
                firework.load([
                    {
                        path: '/foo3.html',
                        action: {
                            events: {
                                ready: function () {
                                    readyCalled3 = true;
                                }
                            }
                        }
                    },
                    {
                        path: '/test/page/foo.html',
                        action: {
                            events: {
                                ready: function () {
                                    readyCalled2 = true;
                                }
                            }
                        }
                    },
                    {
                        path: '/foo.html',
                        action: {
                            events: {
                                ready: function () {
                                    readyCalled = true;
                                }
                            }
                        }
                    },
                    {
                        path: '/test/page2/fooX.html',
                        action: {
                            events: {
                                ready: function () {
                                    readyCalledX = true;
                                }
                            }
                        }
                    }
                ]);

                router.redirect('/test/page/foo3.html');
                setTimeout(function () {
                    expect(config.root).toEqual('/test/page/');
                    expect(readyCalled3).toBeTruthy();

                    router.redirect('/test/page/foo.html');
                    setTimeout(function () {
                        expect(readyCalled).toBeTruthy();
                        expect(readyCalled2).not.toBeTruthy();

                        router.redirect('/test/page2/fooX.html');
                        setTimeout(function () {
                            expect(readyCalledX).toBeTruthy();

                            config.root = rawRoot;
                            done();
                        }, WAITE_TIME);
                    }, WAITE_TIME);
                }, WAITE_TIME);
            });

            it('index option', function (done) {
                var config = require('saber-pjax/pjax/config');
                var rawIndex = config.index;
                router.config({
                    index: 'foo6.html'
                });

                var rawAjax = config.ajax;
                config.ajax = {
                    get: function (url, params) {
                        pjaxUrl = url;
                        pjaxParams = params;

                        var promise = Resolver.resolved('<div>foo6</div>');
                        promise.abort = function () {};
                        return promise;
                    }
                };

                var readyCalled;
                firework.load([
                    {
                        path: '/test/page/foo6.html',
                        action: {
                            events: {
                                ready: function () {
                                    readyCalled = true;
                                }
                            }
                        }
                    }
                ]);

                router.redirect('/test/page/');
                setTimeout(function () {
                    expect(config.index).toEqual('foo6.html');
                    expect(readyCalled).toBeTruthy();

                    expect(main.innerHTML.replace(/\s+/g, ''))
                        .toEqual('<div><div>foo6</div></div>');

                    config.index = rawIndex;
                    config.ajax = rawAjax;

                    done();
                }, WAITE_TIME);
            });
        });

    }

    return {
        test: function (firework, main) {
            function clear() {
                firework.delCachedAction();
                router.clear();
                firework.load({path: '/test/runner.html', action: {}});
            }

            testRouterOptions(firework, main, clear);
            testModelExtension(firework, main, clear);
            testRouteEvents(firework, main, clear);
            testNotSupportPjax(firework, main, clear);
            // testScroll(firework, main, clear);
        }
    }
});
