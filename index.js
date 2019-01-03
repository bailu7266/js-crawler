const {
    ipcRenderer,
    remote
} = require('electron');

var linkRoutes = {
    'link-home': onHome,
    'link-tools': onTools,
    'link-test': onTest,
    'link-contacts': nothing,
    'link-signup': nothing
};
var keys = Object.keys(linkRoutes);
for (let i = 0; i < keys.length; i++) {
    let fResp = linkRoutes[keys[i]];
    if (fResp)
        document.getElementById(keys[i]).addEventListener('click', fResp);
}

function nothing() {}

function onHome() {

}

function onTest() {
    ipcRenderer.send('AMCH-Request-TestAddon');
}

function onTools() {

}