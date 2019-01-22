const {
    ipcRenderer,
    remote
} = require('electron');
const {
    app,
    BrowserWindow
} = remote;
const Menubar = require('./css-menu.js');
const { VResizer, HResizer } = require('./resizer.js');
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
    'new-view': newView,
    'devtools': clickDevTools,
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
    if (platform == 'darwin') {
        document.getElementById('titlebar').style.justifyContent = 'center';
        document.getElementById('menubar').style.display = 'none';
        document.getElementById('window-ctrls').style.display = 'none';
    } else {
        // buildCustomMenu();
        new Menubar('menubar');
        document.getElementById('devtools').checked = contents.isDevToolsOpened();
    }

    new HResizer(document.getElementById('res-column'));
    new VResizer(document.getElementById('main-view'));

    layout();

    routeInit();
});

function layout() {
    // 主要分配flex item的width/height的比例;
    document.getElementById('res-column').style.width = '50%';
    return;
}

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
    ipcRenderer.send('AMCH-Request', 'TestAddon');
}

function onTools() {}

function newView() {
    ipcRenderer.send('AMCH-Request', 'NewBrowserView', `file:///${__dirname}/nvtest.html`);
}

ipcRenderer.on('AMCH-Response', (e, name, msg) => {
    console.log(name + ': ' + msg);
});