const {
    app,
    ipcMain,
    BrowserView,
    BrowserWindow
} = require('electron');

let winMain;

function createWindow() {
    let winBounds = { width: 1200, height: 960 };
    winMain = new BrowserWindow(winBounds);

    let view = new BrowserView();
    winMain.setBrowserView(view);
    let viewBounds = winMain.getContentBounds();
    viewBounds.x = 0;
    viewBounds.y = 0;
    // viewBounds.width = winBounds.width;
    // viewBounds.height = winBounds.height;
    view.setBounds(viewBounds);
    view.setBackgroundColor('#0000ff');
    // view.setAutoResize({ width: true, height: true });

    let url = require('url').format({
        protocol: 'file',
        slashes: true,
        pathname: require('path').join(__dirname, 'welcome.html')
    });

    view.webContents.loadURL(url);

    view.webContents.openDevTools();

    winMain.on('closed', () => {
        winMain = null;
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

ipcMain.on('MCH-NewBrowerView', (event, url) => {
    console.log('准备新增一个 BrowserView: ' + url);
    let vwNew = new BrowserView();
    vwNew.setBackgroundColor('#ff0000');
    winMain.setBrowserView(vwNew);
    // vwNew.webContents.loadURL(url);

    let bounds = winMain.getContentBounds();
    let vwBounds = { x: 0, y: 0, width: bounds.width, height: bounds.height };
    let view = BrowserView.getAllViews();
    let vwCnt = view.length; // 包含了新增view
    vwBounds.width = bounds.width / vwCnt;
    for (let idx = 0; idx < vwCnt - 1; idx++) {
        vwBounds.x = bounds.width * idx / vwCnt;
        view[idx].setBounds(vwBounds);
        // vwNew.setAutoResize({ width: true, height: true });
    }

    event.sender.send('MCH-NewBrowerView-OK');
});