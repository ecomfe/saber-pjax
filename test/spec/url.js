define(function (require) {
    console.log('run url sepc...')
    require('saber-lang');
    var urlUtil = require('saber-pjax/pjax/url');

    describe('url util', function () {
        it('isSameUrl', function () {
            expect(urlUtil.isSameUrl('http://a.com/a', 'http://a.com')).toBe(false);
        });
    });
});
