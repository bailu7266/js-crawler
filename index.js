const {
    ipcRenderer,
    remote
} = require('electron');
let win = remote.getCurrentWindow();

const routes = {
    'min-btn': [{ 'click': () => { win.minimize(); } }],
    'max-btn': [{ 'click': () => { win.maximize(); } }],
    'restore-btn': [{ 'click': () => { win.restore(); } }],
    'close-btn': [{ 'click': () => { win.close(); } }],
    'link-home': [{ 'click': onHome }],
    'link-tools': [{ 'click': onTools }],
    'link-test': [{ 'click': onTest }],
    'link-contacts': [{ 'click': nothing }],
    'link-signup': [{ 'click': nothing }]
};

let keys = Object.keys(routes);
for (let i = 0; i < keys.length; i++) {
    let actions = routes[keys[i]];
    let actKeys = Object.keys(actions);
    for (let j = 0; j < actKeys.length; j++) {
        let fResp = actions[actKeys[j]];
        if (fResp)
            document.getElementById(keys[i]).addEventListener(actKeys[j], fResp);
    }
}

function nothing() {}

function onHome() {

}

function onTest() {
    ipcRenderer.send('AMCH-Request-TestAddon');
}

function onTools() {

}