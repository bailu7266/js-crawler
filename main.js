const {
    app,
    ipcMain,
    dialog,
    BrowserView,
    BrowserWindow,
    Menu
} = require('electron');
let path = require('path');
let winMain;

function createWindow() {
    let frame = false;
    let options = {
        // show: false,
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
        options.titleBarStyle = 'customButtonsOnHover';
        // options.titleBarStyle = 'hiddenInset';
        options.frame = frame;
    } else {
        options.titleBarStyle = 'hidden';
        options.frame = frame;
    }

    winMain = new BrowserWindow(options);

    let view = new BrowserView({
        webPreferences: {
            nodeIntegration: true,
        }
    });
    winMain.setBrowserView(view);
    let viewBounds = winMain.getContentBounds();
    viewBounds.x = 0;
    viewBounds.y = 0;
    // viewBounds.width = winBounds.width;
    // viewBounds.height = winBounds.height;
    view.setBounds(viewBounds);
    view.setAutoResize({
        width: true,
        height: true
    });

    let url = require('url').format({
        protocol: 'file',
        slashes: true,
        pathname: path.join(__dirname, 'index.html')
    });

    view.webContents.loadURL(url);

    view.webContents.openDevTools();

    let menu = buildMenu();
    if (process.platform == 'win32' || process.platform == 'linux') {
        if (frame)
            winMain.setMenu(menu);
    } else {
        Menu.setApplicationMenu(menu);
    }

    function devToolsWindow() {
        let menuDev = Menu.getApplicationMenu().getMenuItemById('devtools');
        if (menuDev.checked) {
            view.webContents.openDevTools();
        } else {
            view.webContents.closeDevTools();
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
                    checked: true,
                    id: 'devtools'
                }
            ];
        }

        return Menu.buildFromTemplate(template);
    }

    winMain.on('closed', () => {
        winMain = null;
    });

    winMain.once('ready-to-show', () => {
        winMain.show();
    });

    view.webContents.on('devtools-opened', () => {
        if (frame) {
            let devMI = Menu.getApplicationMenu().getMenuItemById('devtools');
            devMI.checked = true;
        }
    });

    view.webContents.on('devtools-closed', () => {
        if (frame) {
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
    if (winMain === null) {
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

    /*
    let vwNew = new BrowserView();
    winMain.setBrowserView(vwNew);
    vwNew.webContents.loadURL(url);

    let bounds = winMain.getContentBounds();
    let vwBounds = {
        x: 0,
        y: 0,
        width: bounds.width,
        height: bounds.height
    };
    let view = BrowserView.getAllViews();
    let vwCnt = view.length; // 包含了新增view
    vwBounds.width = bounds.width / vwCnt;
    for (let idx = 0; idx < vwCnt - 1; idx++) {
        vwBounds.x = bounds.width * idx / vwCnt;
        view[idx].setBounds(vwBounds);
        // vwNew.setAutoResize({ width: true, height: true });
    }

    // event.sender.send('MCH-NewBrowerView-OK');
    event.returnValue = 'NewBrowserView is OK';
    */
});

ipcMain.on('AMCH-Request-TestAddon', (event, arg) => {
    require('./hello.js')();
    event.sender.send('AMCH-Response-TestAddon', 'TestAddon OK');
});