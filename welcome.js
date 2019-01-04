// This is the welcome renderer process, providing navigator for whole application
// In renderer process electron can only be used as remote
// 其实remote就是用同步IPC实现renderer process和main process之间通信的
const {
    ipcRenderer,
    remote
} = require('electron');
const {
    BrowserWindow,
    dialog
} = remote;
var $ = require('jquery');
var mp = remote.getGlobal('process');
var winMain = remote.getCurrentWindow();
var iDoc = document.getElementById('content-view').contentWindow.document;
// var $ = require('jquery').load(iDoc);

iDoc.getElementById('versions').innerHTML =
    'node ' +
    mp.versions.node +
    ', ' +
    'chrome ' +
    mp.versions.chrome +
    ', ' +
    'electron ' +
    mp.versions.electron +
    '.';
/*
function f1() {
    console.log(this.id);
    iDoc.getElementById('output').innerHTML = '您刚按下了' + this.innerHTML;
    iDoc.getElementById('output-child').innerHTML =
        '您刚按下了' + this.childNodes[0].nodeValue;
}
*/
function f1() {
    console.log(this.id);
    console.log($('title').innerHTML);
    $('#output').innerHTML = '您刚按下了' + this.innerHTML;
    $('#output-child').innerHTML =
        '您刚按下了' + this.childNodes[0].nodeValue;
}

let btn1 = iDoc.getElementById('btn-1');
btn1.onclick = f1;

let btn2 = iDoc.getElementById('btn-2');
btn2.onclick = f1;

let btn3 = iDoc.getElementById('btn-3');
/*
btn3.onclick = () => {
    let win = new BrowserWindow();
    let url = require('url').format({
        protocol: 'file',
        slashes: true,
        pathname: require('path').join(__dirname, 'page1.html')
    });
    win.loadURL(url);
    win.on('closed', () => {
        win = null;
    });
};
*/
iDoc.getElementById('btn-4').onclick = () => {
    let url = require('url').format({
        protocol: 'file',
        slashes: true,
        pathname: require('path').join(__dirname, 'page1.html')
    });
    console.log('即将加载: ' + url);
    winMain.loadURL(url);
};

iDoc.getElementById('link-1').onclick = () => {
    dialog.showMessageBox(
        winMain, {
            type: 'info',
            buttons: [],
            message: '这是一个测试用的Info对话框！',
            detail: '显示详细信息的地方'
        },
        response => {
            console.log('Nav link ' + response + ' has been pressed');
        }
    );
};

btn1.addEventListener('click', () => {
    console.log('Additional event handler triggered');
    ipcRenderer.send('AMCH-Request-TestAddon');
    // let testAddon = require('./hello.js');
    // testAddon();
});

btn3.addEventListener('click', () => {
    let url = `file://${__dirname}/page1.html`;
    let ret = ipcRenderer.sendSync('SMCH-NewBrowerView', url);
    console.log(ret);
});

ipcRenderer.on('AMCH-Response-TestAddon', (event, arg) => {
    console.log(arg);
});