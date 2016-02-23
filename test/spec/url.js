/**
 * @file url spec
 * @author wuhuiyao(sparklewhy@gmail.com)
 */

define(function (require) {
    var urlUtil = require('saber-pjax/pjax/url');

    describe('url util', function () {
        it('isSameUrl', function () {
            expect(urlUtil.isSameUrl('http://a.com/a', 'http://a.com')).toBe(false);
            expect(urlUtil.isSameUrl('http://a.com/a', 'http://a.com/a')).toBe(true);
            expect(urlUtil.isSameUrl('http://a.com/a#a', 'http://a.com')).toBe(false);
            expect(urlUtil.isSameUrl('http://a.com/a#a', 'http://a.com/a#b', true)).toBe(true);
            expect(urlUtil.isSameUrl('http://a.com/a', 'http://a.com/a', true)).toBe(true);
            expect(urlUtil.isSameUrl('http://a.com/', 'http://a.com', true)).toBe(false);
        });

        it('parseUrl', function () {
            var urlInfo = urlUtil.parseURL('https://example.com:123/path/data?key=value#hash');
            expect(urlInfo.host).toEqual('example.com:123');
            expect(urlInfo.pathname).toEqual('/path/data');
            expect(urlInfo.search).toEqual('?key=value');
            expect(urlInfo.hash).toEqual('#hash');


            urlInfo = urlUtil.parseURL('https://example.com');
            expect(urlInfo.host).toEqual('example.com');
            expect(urlInfo.pathname).toEqual('/');
            expect(urlInfo.search).toEqual('');
            expect(urlInfo.hash).toEqual('');

            urlInfo = urlUtil.parseURL('https://example.com#hash');
            expect(urlInfo.host).toEqual('example.com');
            expect(urlInfo.pathname).toEqual('/');
            expect(urlInfo.search).toEqual('');
            expect(urlInfo.hash).toEqual('#hash');

            var urlObj = {};
            urlInfo = urlUtil.parseURL(urlObj);
            expect(urlInfo).toBe(urlObj);
        });

        it('parse query', function () {
            var queryInfo = urlUtil.parseQuery('');
            expect(queryInfo).toEqual({});

            queryInfo = urlUtil.parseQuery('a=3&b=asd&c=true');
            expect(queryInfo).toEqual({a: '3', b: 'asd', c: 'true'});

            queryInfo = urlUtil.parseQuery('a=3&b=asd&c=true&d&e=%E4%B8%AD%E5%9B%BD');
            expect(queryInfo).toEqual({a: '3', b: 'asd', c: 'true', d: true, e: '中国'});

            queryInfo = urlUtil.parseQuery('a=3&b=asd&a=true&d&a=3');
            expect(queryInfo).toEqual({a: ['3', 'true', '3'], b: 'asd', d: true});

            queryInfo = urlUtil.parseQuery('d=3&b=asd&d');
            expect(queryInfo).toEqual({d: '3', b: 'asd'});

            queryInfo = urlUtil.parseQuery('d&b=asd&d=3');
            expect(queryInfo).toEqual({d: '3', b: 'asd'});

            queryInfo = urlUtil.parseQuery('d&b=asd&d=3&d=12');
            expect(queryInfo).toEqual({d: ['3', '12'], b: 'asd'});
        });

        it('serialize', function () {
            var str = urlUtil.serialize({a: 1, b: ['as', '中国'], c: true, d: 0});
            expect(str).toEqual('a=1&b=as%2C%E4%B8%AD%E5%9B%BD&c=true&d=0');

            str = urlUtil.serialize({'省份': 1, b: undefined, c: null});
            expect(str).toEqual('%E7%9C%81%E4%BB%BD=1&c=null');

            str = urlUtil.serialize({});
            expect(str).toEqual('');
        });

        it('updateURL', function () {
            var url = urlUtil.updateURL('http://example.com', {});
            expect(url).toEqual('http://example.com');

            url = urlUtil.updateURL('http://example.com', {a: 3, '省份': '广东'});
            expect(url).toEqual('http://example.com/?a=3&%E7%9C%81%E4%BB%BD=%E5%B9%BF%E4%B8%9C');

            url = urlUtil.updateURL('http://example.com?省份=江苏&a&b=23&c', {a: 3, '省份': '广东'});
            expect(url).toEqual('http://example.com/?%E7%9C%81%E4%BB%BD=%E5%B9%BF%E4%B8%9C&a=3&b=23&c=true');

            url = urlUtil.updateURL('http://example.com?%E7%9C%81%E4%BB%BD=%E7%9C%81%E4%BB%BD&a&b=中国', {a: false, '省份': '广东'});
            expect(url).toEqual('http://example.com/?%E7%9C%81%E4%BB%BD=%E5%B9%BF%E4%B8%9C&a=false&b=%E4%B8%AD%E5%9B%BD');

            url = urlUtil.updateURL('https://example.com:9090?a=3#hash=a', {a: false, hash: 23});
            expect(url).toEqual('https://example.com:9090/?a=false&hash=23#hash=a');
        });
    });
});
