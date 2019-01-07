const {
    ipcRenderer,
    remote
} = require('electron');
let win = remote.getCurrentWindow();

const routes = {
    'min-btn': {
        'click': () => {
            win.minimize();
        }
    },
    'max-btn': {
        'click': () => {
            if (win.isMaximizable) {
                // change window ctrls icon: from max -> restore
                document.getElementById('max-btn').style.display = 'none';
                document.getElementById('restore-btn').style.display = 'flex';
                win.maximize();
            }
        }
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

let keys = Object.keys(routes);
let cnt = 0;
for (let i = 0; i < keys.length; i++) {
    let actions = routes[keys[i]];
    let actKeys = Object.keys(actions);
    for (let j = 0; j < actKeys.length; j++) {
        let fResp = actions[actKeys[j]];
        if (fResp && (fResp instanceof Function)) {
            document.getElementById(keys[i]).addEventListener(actKeys[j], fResp);
            cnt++;
        }
    }
}
console.log('一共注册了 ' + cnt + ' 个响应函数');

function nothing() {}

function onHome() {

}

function onTest() {
    ipcRenderer.send('AMCH-Request-TestAddon');
}

function onTools() {

}