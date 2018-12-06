const addon = require('./build/Debug/n_addon');
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

var pt1 = new myPoint(1, 2);
var pt2 = myPoint(3, 4);
console.log('pt1.x = ' + pt1.x + 'pt1.y = ' + pt1.y);
console.log('pt2.x = ' + pt2.x + 'pt2.y = ' + pt2.y);
pt1.move(10, 20);
console.log('pt1变成了：x = ' + pt1.x + '\ty = ' + pt1.y);
console.log('pt1和pt2之间的距离：' + pt1.distance(pt2.x, pt2.y));