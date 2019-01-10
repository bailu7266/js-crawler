const {
    ipcRenderer,
    remote
} = require('electron');
let platform = remote.getGlobal('process').platform;
let win = remote.getCurrentWindow();
let contents = remote.getCurrentWebContents();

const routes = {
    'min-btn': {
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
    }
};
/*
var currentPopu = null;
var menuIds = ['menu-file', 'menu-window'];
// 为了在mac上测试。
// var menuIds = ['tab-1', 'tab-2'];
var menu = [];
*/
window.addEventListener('load', () => {
    /*if (platform == 'darwin') {
        document.getElementById('titlebar').style.justifyContent = 'center';
        document.getElementById('menubar').style.display = 'none';
        document.getElementById('window-ctrls').style.display = 'none';
    } else {
        // buildCustomMenu();
    }*/

    // window.addEventListener('blur', () => { console.log('BrowserWindow lost focus'); }, false);
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
                document.getElementById(keys[i]).addEventListener(actKeys[j], fResp);
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

/*
function buildCustomMenu() {
    let menuFile = new Menu();
    menuFile.append(new MenuItem({
        role: 'about'
    }));
    menuFile.append(new MenuItem({
        type: 'separator'
    }));
    menuFile.append(new MenuItem({
        role: 'quit'
    }));
    menu.push(menuFile);

    let menuWindow = new Menu();
    menuWindow.append(new MenuItem({
        role: 'minimize'
    }));
    menuWindow.append(new MenuItem({
        role: 'close'
    }));
    menuWindow.append(new MenuItem({
        type: 'separator'
    }));

    menuWindow.append(new MenuItem({
        label: 'Development Tools',
        type: 'checkbox',
        id: 'devtools',
        checked: contents.isDevToolsOpened(),
        click() {
            if (this.checked) {
                contents.openDevTools();
            } else {
                contents.closeDevTools();
            }
        }
    }));

    menu.push(menuWindow);

    for (let i = 0; i < menuIds.length; i++) {
        let mi = document.getElementById(menuIds[i]);
        if (mi) {
            mi.addEventListener('click', clickMenu, false);
            mi.addEventListener('mouseover', hoverMenu, false);
            // mi.addEventListener('blur', blurMenu);
            mi.addEventListener('mouseout', leaveMenu);
        } else {
            console.log('Something has been wrong with menu handler');
        }
    }
}

function clickMenu() {
    // this.blur();
    if (currentPopu) {
        let idx = menuIds.indexOf(this.id);
        if (idx == menu.indexOf(currentPopu)) {
            // this.blur();
            currentPopu.closePopup();
            currentPopu = null;
        } else {
            changeMenuItem(this);
        }
    } else {
        let idx = menuIds.indexOf(this.id);
        currentPopu = menu[idx];
        let rect = this.getBoundingClientRect();
        currentPopu.popup({
            async: true,
            // window: contents,
            x: rect.left,
            y: rect.top + rect.height
        });
        // win.focus();
    }
}

function changeMenuItem(elt) {
    // elt.focus();
    currentPopu.closePopup();
    currentPopu = menu[menuIds.indexOf(elt.id)];
    let rect = elt.getBoundingClientRect();
    currentPopu.popup({
        async: true,
        // window: contents,
        x: rect.left,
        y: rect.top + rect.height
    });
    // win.focus();
}

function leaveMenu() {
    // this.blur();
    console.log('Mouse out of ' + this.id);
}

function hoverMenu() {
    if (currentPopu) {
        if (this.id != menuIds[menu.indexOf(currentPopu)]) {
            // this.focus();
            changeMenuItem(this);
        }
    }
}

function blurMenu() {
    if (currentPopu) {
        let idx = menuIds.indexOf(this.id);
        if (idx && (idx != menu.indexOf(currentPopu))) {
            changeMenuItem(this);
        } else {
            currentPopu.closePopup();
            currentPopu = null;
        }
    }
}
*/
function nothing() {}

function onHome() {

}

function onTest() {
    ipcRenderer.send('AMCH-Request-TestAddon');
}

function onTools() {

}