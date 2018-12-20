// This is the welcome renderer process, providing navigator for whole application
// In renderer process electron can only be used as remote
// 其实remote就是用同步IPC实现renderer process和main process之间通信的
const { remote } = require('electron');
const { BrowserWindow, dialog } = remote;
var mp = remote.getGlobal('process');
var winMain = remote.getCurrentWindow();

document.getElementById('versions').innerHTML =
    'node ' +
    mp.versions.node +
    ', ' +
    'chrome ' +
    mp.versions.chrome +
    ', ' +
    'electron ' +
    mp.versions.electron +
    '.';

function f1() {
    console.log(this.id);
    document.getElementById('output').innerHTML = '您刚按下了' + this.innerHTML;
    document.getElementById('output-child').innerHTML =
        '您刚按下了' + this.childNodes[0].nodeValue;
}

document.getElementById('btn-1').onclick = f1;

document.getElementById('btn-2').onclick = f1;

document.getElementById('btn-3').onclick = () => {
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

document.getElementById('btn-4').onclick = () => {
    let url = require('url').format({
        protocol: 'file',
        slashes: true,
        pathname: require('path').join(__dirname, 'page1.html')
    });
    winMain.loadURL(url);
};

document.getElementById('link-1').onclick = () => {
    dialog.showMessageBox(
        winMain,
        {
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