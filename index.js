const { ipcRenderer, remote } = require('electron');
const { app, BrowserWindow } = remote;
const Menubar = require('./css-menu.js');
let platform = remote.getGlobal('process').platform;
let win = remote.getCurrentWindow();
let contents = remote.getCurrentWebContents();

const routes = {
    'min-btn': () => {
        win.minimize();
    },
    'link-min': () => {
        win.minimize();
    },
    'max-btn': maxBrowerWindow,
    'restore-btn': () => {
        if (win.isMaximized) {
            // change window ctrls icon: from restore -> max
            document.getElementById('restore-btn').style.display = 'none';
            document.getElementById('max-btn').style.display = 'flex';
            win.unmaximize();
        }
    },
    'close-btn': () => {
        win.close();
    },
    'link-close': () => {
        win.close();
    },
    'link-home': onHome,
    'link-tools': onTools,
    'link-test': onTest,
    'link-contacts': nothing,
    'link-signup': nothing,
    devtools: clickDevTools,
    'link-about': () => {
        let options = {
            parent: win,
            modal: true,
            show: false,
            frame: false,
            // useContentSize: true,
            resizable: false,
            minimizable: false,
            maximizable: false,
            center: true,
            // y: 100,
            width: 380,
            height: 200,
            webPreferences: {
                devTools: false
            }
        };
        if (platform === 'darwin') {
            // options.titleBarStyle = 'hiddenInset';
            options.modal = false;
            options.frame = true;
        }

        let winAbout = new BrowserWindow(options);
        winAbout.loadFile('./about.html');
        winAbout.once('ready-to-show', () => {
            winAbout.show();
        });
    },
    'link-quit': () => {
        console.log('link-quit clicked');
        app.quit();
    }
};

window.addEventListener('load', () => {
    /*if (platform == 'darwin') {
        document.getElementById('titlebar').style.justifyContent = 'center';
        document.getElementById('menubar').style.display = 'none';
        document.getElementById('window-ctrls').style.display = 'none';
    } else {
        // buildCustomMenu();
    }*/

    // window.addEventListener('blur', () => { console.log('BrowserWindow lost focus'); }, false);

    /* for (let i = 0; i < menuIds.length; i++) {
        let mi = document.getElementById(menuIds[i]);
        if (mi) addCSSMenu(mi);
    }*/
    new Menubar('menubar');

    routeInit();
});

function routeInit() {
    let keys = Object.keys(routes);
    for (let i = 0; i < keys.length; i++) {
        let id = keys[i];
        let fResp = routes[id];
        if (fResp && fResp instanceof Function) {
            document.getElementById(id).addEventListener('click', fResp, false);
        }
    }
}

function maxBrowerWindow() {
    if (win.isMaximizable) {
        // change window ctrls icon: from max -> restore
        document.getElementById('max-btn').style.display = 'none';
        document.getElementById('restore-btn').style.display = 'flex';
        win.maximize();
    }
}

function clickDevTools() {
    if (this.checked) {
        contents.openDevTools();
    } else {
        contents.closeDevTools();
    }
}

function nothing() {}

function onHome() {}

function onTest() {
    ipcRenderer.send('AMCH-Request-TestAddon');
}

function onTools() {}