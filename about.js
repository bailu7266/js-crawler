const {
    remote
} = require('electron');
const {
    app
} = remote;

let win = remote.getCurrentWindow();
let versions = remote.getGlobal('process').versions;
document.title = app.getName();
document.getElementById('app-icon').src = './images/app-icon.png';
document.getElementById('versions').innerHTML =
    'Electron version: ' + versions.electron + '<br>' +
    'Chrome version: ' + versions.chrome + '<br>' +
    'Node version: ' + versions.node + '<br>' +
    'Version: ' + app.getVersion();
document.getElementById('btn-ok').onclick = () => {
    win.close();
};