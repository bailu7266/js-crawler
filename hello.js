const addon = require('./build/Release/n_addon');
console.log(addon.hello('Tom', 'Jerry', 'McDonald'));
var obj = { request: "黄河", response: "" };
console.log('发送前, request = ' + obj.request + '\tresponse = ' + obj.response);
var ret = addon.testObj(obj);
console.log('返回码是' + ret);
if (ret === 0)
    console.log('发送后, request = ' + obj.request + '\tresponse = ' + obj.response);