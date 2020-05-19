module.exports = () => {
    const addon = require('./n_addon');
    console.log(addon.hello('Tom', 'Jerry', 'McDonald'));
    console.log(addon.hello('Tom', 'Jerry', 'McDonald'));
    var obj = {
        request: '黄河',
        response: ''
    };
    console.log(
        '发送前, request = ' + obj.request + '\tresponse = ' + obj.response
    );
    var ret = addon.testObj(obj);
    console.log('返回码是' + ret);
    if (ret === 0)
        console.log(
            '发送后, request = ' + obj.request + '\tresponse = ' + obj.response
        );

    ret = addon.testCallback((s, buff) => {
        console.log(s);
        console.log(buff.toString());
        return 55;
    });

    console.log('回调函数返回：' + ret);

    var pt1 = new MyPoint(1, 2);
    var pt2 = new MyPoint(pt1);
    console.log('\npt1.x = ' + pt1.x + '\tpt1.y = ' + pt1.y);
    console.log('\npt2.x = ' + pt2.x + '\tpt2.y = ' + pt2.y);
    pt1.move(10, 20);
    console.log('\npt1变成了：x = ' + pt1.x + '\ty = ' + pt1.y);
    console.log('\npt1和pt2之间的距离：' + pt1.distance(pt2.x, pt2.y));
    console.log('\npt1和pt2之间的距离：' + pt1.distance(pt2));

    var asyncHook = require('async_hooks');
    addon.testAsync(asyncHook, 'n-addon.天字一号');
    // addon.testAsync(asyncHook, 'n-addon.天字一号');
};