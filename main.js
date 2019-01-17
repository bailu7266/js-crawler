const {
    app,
    ipcMain,
    dialog,
    BrowserView,
    BrowserWindow,
    Menu,
    Tray
} = require('electron');
const nativeImage = require('electron').nativeImage;
let path = require('path');
let appImage = nativeImage.createFromPath('./images/app-icon.png');
var win;

function createWindow() {
    let frame = false;
    let options = {
        icon: appImage,
        show: false,
        width: 1600,
        height: 960,
        // titleBarStyle: 'customButtonsOnHover',
        // frame: false,
        webPreferences: {
            nodeIntegration: false,
        }
    };

    // 在macOS下，创建frameless window
    if (process.platform == 'darwin') {
        // frame = true;
        options.frame = frame;
        options.titleBarStyle = 'customButtonsOnHover';
        // options.titleBarStyle = 'hiddenInset';
    } else {
        options.frame = frame;
        options.titleBarStyle = 'hidden';
    }

    win = new BrowserWindow(options);

    let view = new BrowserView();
    win.setBrowserView(view);

    let bounds = win.getContentBounds();
    view.setBounds({
        x: 0,
        y: 0,
        width: bounds.width,
        height: bounds.height
    });
    view.setAutoResize({
        width: true,
        height: true
    });

    let tray;
    if (process.platform === 'darwin') {
        tray = new Tray(appImage.resize({
            width: 16,
            height: 16,
            quality: 'best'
        }));
        tray.setTitle('无限遐想');
    } else {
        tray = new Tray(appImage);
    }

    let url = require('url').format({
        protocol: 'file',
        slashes: true,
        pathname: path.join(__dirname, 'index.html')
    });

    let menu = buildMenu();
    if (process.platform == 'win32' || process.platform == 'linux') {
        if (frame)
            win.setMenu(menu);
    } else {
        Menu.setApplicationMenu(menu);
    }

    // build context-menu for system tray
    let contextMenu = Menu.buildFromTemplate([{
            label: '选项1',
            type: 'checkbox',
            checked: true
        },
        {
            label: '选项2',
            type: 'radio'
        },
        {
            type: 'separator'
        },
        {
            label: '选项3',
            click: () => {}
        }
    ]);
    tray.setContextMenu(contextMenu);
    tray.setToolTip('学习 electron & Javascript');

    // view.webContents.openDevTools();

    view.webContents.loadURL(url);

    // win.show();

    function devToolsWindow() {
        if (frame || (process.platform === 'darwin')) {
            let menuDev = Menu.getApplicationMenu().getMenuItemById('devtools');
            if (menuDev.checked) {
                view.webContents.openDevTools();
            } else {
                view.webContents.closeDevTools();
            }
        }
    }

    function buildMenu() {
        let template = [{
            role: 'window',
            submenu: [{
                    role: 'minimize'
                },
                {
                    role: 'close'
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Development Tools',
                    click: devToolsWindow,
                    type: 'checkbox',
                    checked: true,
                    id: 'devtools'
                }
            ]
        }];

        if (process.platform === 'darwin') {
            template.unshift({
                label: app.getName(),
                submenu: [{
                        role: 'about'
                    },
                    {
                        type: 'separator'
                    },
                    {
                        role: 'services'
                    },
                    {
                        type: 'separator'
                    },
                    {
                        role: 'hide'
                    },
                    {
                        role: 'hideothers'
                    },
                    {
                        role: 'unhide'
                    },
                    {
                        type: 'separator'
                    },
                    {
                        role: 'quit'
                    }
                ]
            });

            template[1].submenu = [{
                    role: 'minimize'
                },
                {
                    role: 'close'
                },
                {
                    role: 'zoom'
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Development Tools',
                    click: devToolsWindow,
                    type: 'checkbox',
                    checked: view.webContents.isDevToolsOpened(),
                    id: 'devtools'
                }
            ];
        }

        return Menu.buildFromTemplate(template);
    }

    win.on('closed', () => {
        win = null;
    });

    win.once('ready-to-show', () => {
        win.show();
        view.webContents.focus();
    });

    view.webContents.on('dom-ready', () => {
        win.show();
        view.webContents.focus();
    });

    view.webContents.on('devtools-opened', () => {
        if (frame || (process.platform === 'darwin')) {
            let devMI = Menu.getApplicationMenu().getMenuItemById('devtools');
            devMI.checked = true;
        }
    });

    view.webContents.on('devtools-closed', () => {
        if (frame || (process.platform === 'darwin')) {
            let devMI = Menu.getApplicationMenu().getMenuItemById('devtools');
            devMI.checked = false;
        }
    });
}

app.on('ready', createWindow);

// 当全部窗口关闭时退出。
app.on('window-all-closed', () => {
    // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
    // 否则绝大部分应用及其菜单栏会保持激活。
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // 在macOS上，当单击dock图标并且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口。
    if (win === null) {
        createWindow();
    }
});

ipcMain.on('SMCH-NewBrowerView', (event, url) => {
    console.log('准备新增一个 BrowserView: ' + url);

    dialog.showMessageBox({
        type: 'info',
        button: [],
        message: '无法创建新的 BrowserView',
        detail: '目前(electron 4.0.0)BrowserView只支持一个BrowserWindow创建一个BrowserView',
    });

    event.returnValue = '创建新的 BrowserView 没有成功';
});

ipcMain.on('AMCH-Request', (e, name, msg) => {
    var result;
    switch (name) {
        case 'TestAddon':
            result = onTestAddon(msg);
            break;

        case 'NewBrowserView':
            result = newBrowserView(msg);
            break;
    }

    e.sender.send('AMCH-Response', name, result ? 'Success' : 'Failed');
});

ipcMain.on('SMCH-Request', (e, name, msg) => {
    switch (name) {
        case 'BrowserViews':
            e.returnValue = BrowserView.getAllViews();
            break;
    }
});

function newBrowserView(url) {
    let nv = new BrowserView();
    win.setBrowserView(nv);

    let bounds = win.getContentBounds();
    nv.setBounds({
        x: 0,
        y: 0,
        width: bounds.width,
        height: bounds.height
    });
    nv.setAutoResize({
        width: true,
        height: true
    });
    let views = BrowserView.getAllViews();
    let vwCnt = views.length; // 包含了新增view
    /* vwBounds.width = bounds.width / vwCnt;
    for (let idx = 0; idx < vwCnt - 1; idx++) {
        vwBounds.x = bounds.width * idx / vwCnt;
        views[idx].setBounds(vwBounds);
    } */

    // e.sender.send('AMCH-Response', 'NewBrowerView', 'OK');
    // e.returnValue = 'NewBrowserView is OK';

    nv.webContents.openDevTools();
    nv.webContents.loadURL(url);

    return true;
}

function onTestAddon(msg) {
    require('./hello.js')();
    return true;
    // e.sender.send('AMCH-Response-TestAddon', 'TestAddon OK');
}