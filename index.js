const {
    ipcRenderer,
    remote
} = require('electron');
const {
    app,
    BrowserWindow
} = remote;
const Menubar = require('./css-menu.js');
const {
    VResizer,
    HResizer
} = require('./resizer.js');
const dbgLog = require('./dbg-log.js');
let platform = remote.getGlobal('process').platform;
let win = remote.getCurrentWindow();
let contents = remote.getCurrentWebContents();

const menu = [{
    id: 'menu-file',
    label: '文件',
    content: [{
        id: 'm-about',
        label: 'About',
        shortcut: 'Alt+a',
        click: about
    }, {
        type: 'separator'
    }, {
        type: 'submenu',
        label: '最近打开的文件',
        content: [{
            id: 'm-file-1',
            label: '文件1'
        }, {
            id: 'm-file-2',
            label: '文件2'
        }, {
            id: 'm-file-3',
            label: '文件3'
        }]
    }, {
        type: 'separator'
    }, {
        id: 'm-quit',
        label: '退出',
        shortcut: 'Ctrl+x',
        click: () => { app.quit(); }
    }]
}, {
    id: 'menu-window',
    label: 'window',
    content: [{
        id: 'm-min',
        label: 'Minimize',
        click: () => { win.minimize(); }
    }, {
        id: 'm-max',
        label: 'Maximize',
        click: () => { win.maximize(); }
    }, {
        id: 'm-close',
        label: 'Close',
        click: () => { win.close(); }
    }, {
        type: 'separator'
    }, {
        type: 'checkbox',
        id: 'm-devtools',
        label: 'Development Tools',
        click: clickDevTools
    }]
}];

const routes = {
    'min-btn': () => {
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
    'link-home': onHome,
    'link-tools': onTools,
    'link-test': onTest,
    'link-contacts': nothing,
    'link-signup': nothing,
    'new-view': newView,
};

window.addEventListener('load', () => {
    layout();

    routeInit();
});

function about() {
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
}

function layout() {
    if (platform == 'darwin') {
        document.getElementById('titlebar').style.justifyContent = 'center';
        document.getElementById('menubar').style.display = 'none';
        document.getElementById('window-ctrls').style.display = 'none';
    } else {
        // buildCustomMenu();
        new Menubar('menubar', menu);
        document.getElementById('m-devtools').checked = contents.isDevToolsOpened();
    }

    // 主要分配flex item的width/height的比例;
    // document.getElementById('res-column').style.width = '50%';
    let resizables = document.querySelectorAll('.resizable');
    for (let i = 0; i < resizables.length; i++) {
        let elt = resizables[i];
        if ((elt.parentElement.style.flexDirection == 'column') ||
            (elt.parentElement.classList.contains('flex-col'))) {
            new VResizer(elt);
        } else if ((elt.parentElement.style.flexDirection == 'row') ||
            (elt.parentElement.classList.contains('flex-row'))) {
            new HResizer(elt);
        }
    }
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
    dbgLog(name + ': ' + msg);
});