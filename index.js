const {
    ipcRenderer,
    remote
} = require('electron');

var linkIds = { 'link-home': f1, 'link-tools': , 'link-test': , 'link-contacts': , 'link-contacts': , 'link-signup': };
var eltLinks;

for (let i = 0; i < linkIds.length; i++) {
    eltLinks[i] = document.getElementById(linkIds[i]);
}

linkHome.addEventListener();