// This is the welcome renderer process, providing navigator for whole application
// In renderer process electron can only be used as remote
// 其实remote就是用同步IPC实现renderer process和main process之间通信的
const { remote } = require('electron');
const { BrowserWindow } = remote
var mp = remote.getGlobal('process');
var winMain = remote.getCurrentWindow();

function f1() {
    console.log(this.id);
    document.getElementById('output').innerHTML = '您刚按下了' + this.innerHTML;
    document.getElementById('output-child').innerHTML = '您刚按下了' +
        this.childNodes[0].nodeValue;
}

document.getElementById('btn-1').onclick = f1;

document.getElementById('btn-2').onclick = f1;