const {
    ipcRenderer,
    remote
} = require('electron');
const {
    app
} = remote;
const initMenubar = require('./css-menu.js');
let platform = remote.getGlobal('process').platform;
let win = remote.getCurrentWindow();
let contents = remote.getCurrentWebContents();

const routes = {
    'min-btn': {
        'click': () => {
            win.minimize();
        }
    },
    'link-min': {
        'click': () => {
            win.minimize();
        }
    },
    'max-btn': {
        'click': maxBrowerWindow
    },
    'restore-btn': {
        'click': () => {
            if (win.isMaximized) {
                // change window ctrls icon: from restore -> max
                document.getElementById('restore-btn').style.display = 'none';
                document.getElementById('max-btn').style.display = 'flex';
                win.unmaximize();
            }
        }
    },
    'close-btn': {
        'click': () => {
            win.close();
        }
    },
    'link-close': {
        'click': () => {
            win.close();
        }
    },
    'link-home': {
        'click': onHome
    },
    'link-tools': {
        'click': onTools
    },
    'link-test': {
        'click': onTest
    },
    'link-contacts': {
        'click': nothing
    },
    'link-signup': {
        'click': nothing
    },
    'devtools': {
        'click': clickDevTools,
    },
    'link-quit': {
        'click': () => {
            console.log('link-quit clicked');
            app.quit();
        }
    }
};

// var currentPopu = null;
var menuIds = ['menu-file', 'menu-window'];
// 为了在mac上测试。
// var menuIds = ['tab-1', 'tab-2'];
var menu = [];

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
    initMenubar('menubar');

    routeInit();
});

function routeInit() {
    let keys = Object.keys(routes);
    for (let i = 0; i < keys.length; i++) {
        let actions = routes[keys[i]];
        let actKeys = Object.keys(actions);
        for (let j = 0; j < actKeys.length; j++) {
            let fResp = actions[actKeys[j]];
            if (fResp && (fResp instanceof Function)) {
                document.getElementById(keys[i]).addEventListener(actKeys[j], fResp, false);
            }
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
    // close menu-list
    // 关闭了整个menu-list，即使在menu-list:hover的时候也不显示了
    // let menu = this.parentElement.parentElement; // .menu-list>a>input
    // menu.style.display = 'none';

    // 应该设法让menu-list失去mouseover
    // dispatchEvent('mouseout') to menu-list
}

function nothing() {}

function onHome() {

}

function onTest() {
    ipcRenderer.send('AMCH-Request-TestAddon');
}

function onTools() {

}